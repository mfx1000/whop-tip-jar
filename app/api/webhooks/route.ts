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
		// Extract payment details
		const paymentId = payment.id;
		const amount = payment.amount_after_fees ? payment.amount_after_fees / 100 : 0; // Convert from cents to dollars
		const companyId = payment.company?.id;
		const userId = payment.user?.id;
		const username = payment.user?.username || 'Anonymous';
		const productId = payment.product?.id;
		
		if (!companyId || !userId || !amount) {
			console.error('Missing required payment data:', { paymentId, companyId, userId, amount });
			return;
		}

		// Record the transaction in our database
		const transactionResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tip-history`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				companyId,
				fromUserId: userId,
				fromUsername: username,
				amount,
				paymentId,
				productId,
				status: 'completed',
				// Whop handles the split automatically, so we calculate estimates
				creatorAmount: amount * 0.8,
				developerAmount: amount * 0.2,
				whopFee: amount * 0.029 + 0.30, // Estimated fee
			}),
		});

		if (!transactionResponse.ok) {
			const errorData = await transactionResponse.json();
			console.error('Failed to record transaction:', errorData);
			return;
		}

		// Update analytics
		const analyticsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tip-analytics`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				companyId,
				tipAmount: amount,
				creatorAmount: amount * 0.8,
				developerAmount: amount * 0.2,
				whopFee: amount * 0.029 + 0.30,
			}),
		});

		if (!analyticsResponse.ok) {
			const errorData = await analyticsResponse.json();
			console.error('Failed to update analytics:', errorData);
		}

		console.log('Successfully processed tip payment:', { paymentId, amount, companyId });

	} catch (error) {
		console.error('Error handling payment succeeded webhook:', error);
	}
}
