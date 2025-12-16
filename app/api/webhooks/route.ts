import { waitUntil } from "@vercel/functions";
import type { Payment } from "@whop/sdk/resources.js";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(request: NextRequest): Promise<Response> {
	try {
		// Validate that webhook is from Whop using webhook secret
		const requestBodyText = await request.text();
		const headers = Object.fromEntries(request.headers);
		
		// Parse webhook data
		let webhookData;
		try {
			// Only validate with secret if it's properly configured (not placeholder)
			const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;
			if (webhookSecret && webhookSecret !== "get_this_after_creating_a_webhook_in_the_app_settings_screen") {
				// Production mode with real webhook secret
				webhookData = whopsdk.webhooks.unwrap(requestBodyText, { 
					headers,
					key: webhookSecret 
				});
			} else {
				// Development mode - skip webhook validation
				console.log("⚠️ Development mode: skipping webhook validation");
				webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
			}
		} catch (error) {
			console.error("Failed to parse webhook:", error);
			return new Response("Invalid webhook", { status: 400 });
		}

		// Handle webhook event
		if (webhookData.type === "payment.succeeded") {
			waitUntil(handlePaymentSucceeded(webhookData.data));
		}

		// Make sure to return a 2xx status code quickly. Otherwise, webhook will be retried.
		return new Response("OK", { status: 200 });
		
	} catch (error) {
		console.error("Webhook error:", error);
		return new Response("Webhook processing failed", { status: 500 });
	}
}

async function handlePaymentSucceeded(payment: Payment) {
	console.log("[PAYMENT SUCCEEDED]", payment);
	
	try {
		// Extract accurate payment details from webhook
		const paymentId = payment.id;
		// Use any type to access properties not in the Payment type definition
		const paymentData = payment as any;
		const grossAmount = paymentData.amount ? paymentData.amount / 100 : 0; // Convert from cents to dollars
		const amountAfterFees = paymentData.amount_after_fees ? paymentData.amount_after_fees / 100 : grossAmount; // Convert from cents to dollars
		const feeAmount = paymentData.fee_amount ? paymentData.fee_amount / 100 : (grossAmount - amountAfterFees); // Convert from cents to dollars
		const companyId = paymentData.company?.id;
		const userId = paymentData.user?.id;
		const username = paymentData.user?.username || 'Anonymous';
		const metadata = paymentData.checkout?.metadata || {};
		
		if (!companyId || !userId || !amountAfterFees) {
			console.error('Missing required payment data:', { paymentId, companyId, userId, amountAfterFees });
			return;
		}

		// Calculate accurate payout splits (80% to company, 20% to developer)
		const companyAmount = amountAfterFees * 0.8;
		const developerAmount = amountAfterFees * 0.2;

		console.log('Payment breakdown:', {
			grossAmount,
			feeAmount,
			amountAfterFees,
			companyAmount,
			developerAmount
		});

		// Developer user ID (replace with your actual developer user ID)
		const developerUserId = process.env.DEVELOPER_USER_ID || 'user_DEVELOPER_ID_HERE';

		// Record transaction first with accurate amounts
		const transactionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tip-history`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				companyId,
				fromUserId: userId,
				fromUsername: username,
				amount: grossAmount, // Original tip amount
				netAmount: amountAfterFees, // Amount after fees
				paymentId,
				status: 'completed',
				// Accurate payout amounts
				companyAmount,
				developerAmount,
				feeAmount,
				// Metadata from checkout
				experienceId: metadata.experienceId,
				tipperId: metadata.tipperId,
				experienceName: metadata.experienceName,
				tipperName: metadata.tipperName,
			}),
		});

		if (!transactionResponse.ok) {
			const errorData = await transactionResponse.json();
			console.error('Failed to record transaction:', errorData);
			return;
		}

		// Execute payout transfers using Whop API
		try {
			// Transfer 80% to the company
			if (companyAmount >= 0.01) { // Only transfer if amount is meaningful
				const companyTransfer = await whopsdk.transfers.create({
					amount: companyAmount,
					currency: 'usd',
					destination_id: companyId, // Transfer to company
					origin_id: companyId, // From company's balance
					notes: `Tip payment share (80%) from ${username} for payment ${paymentId}`,
					idempotence_key: `tip_company_${paymentId}`,
				});
				console.log('Company transfer created:', companyTransfer.id);
			}

			// Transfer 20% to developer
			if (developerAmount >= 0.01) { // Only transfer if amount is meaningful
				const developerTransfer = await whopsdk.transfers.create({
					amount: developerAmount,
					currency: 'usd',
					destination_id: developerUserId, // Transfer to developer user
					origin_id: companyId, // From company's balance
					notes: `Developer share TipJar (20%) from tip payment ${paymentId}`,
					idempotence_key: `tip_developer_${paymentId}`,
				});
				console.log('Developer transfer created:', developerTransfer.id);
			}

		} catch (transferError) {
			console.error('Error creating transfers:', transferError);
			// Don't fail the webhook, but log the error for manual intervention
		}

		// Update analytics with accurate data
		const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tip-analytics`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				companyId,
				tipAmount: grossAmount,
				netAmount: amountAfterFees,
				companyAmount,
				developerAmount,
				feeAmount,
			}),
		});

		if (!analyticsResponse.ok) {
			const errorData = await analyticsResponse.json();
			console.error('Failed to update analytics:', errorData);
		}

		console.log('Successfully processed tip payment with accurate payouts:', { 
			paymentId, 
			grossAmount, 
			amountAfterFees, 
			companyAmount, 
			developerAmount,
			companyId 
		});

	} catch (error) {
		console.error('Error handling payment succeeded webhook:', error);
	}
}
