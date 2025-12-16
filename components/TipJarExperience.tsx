'use client';

import { useState, useEffect } from 'react';
import { Button } from "@whop/react/components";
import { useIframeSdk } from "@whop/react";
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, DollarSign, Settings, ExternalLink } from 'lucide-react';

interface TipJarExperienceProps {
	experience: any;
	user: any;
	access: any;
	displayName: string;
	userId: string;
	fullCompany: any;
}

interface TipConfig {
	tipAmounts: number[];
	welcomeMessage: string;
	productIds: Record<string, string>;
}

export default function TipJarExperience({ 
	experience, 
	user, 
	access, 
	displayName, 
	userId,
	fullCompany
}: TipJarExperienceProps) {
	const [tipConfig, setTipConfig] = useState<TipConfig | null>(null);
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
	const [customAmount, setCustomAmount] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [lastPaymentAmount, setLastPaymentAmount] = useState<number | null>(null);
	const iframeSdk = useIframeSdk();

	// Check if current user is the owner of the experience/company
	const isOwner = user?.id === fullCompany?.owner_user?.id || user?.id === experience?.ownerId;



	// Fetch tip configuration
	useEffect(() => {
		fetchTipConfig();
	}, [experience.company?.id]);

	const fetchTipConfig = async () => {
		try {
			const response = await fetch(
				`/api/tip-config?companyId=${experience.company?.id}&experienceId=${experience.id}`
			);
			const data = await response.json();
			setTipConfig(data.data);
		} catch (error) {
			console.error('Error fetching tip config:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleTipSelect = (amount: number) => {
		setSelectedAmount(amount);
		setCustomAmount('');
	};

	const handleCustomAmountChange = (value: string) => {
		setCustomAmount(value);
		setSelectedAmount(null);
	};

	const getTipAmount = () => {
		if (selectedAmount !== null) return selectedAmount;
		const custom = parseFloat(customAmount);
		return isNaN(custom) ? 0 : custom;
	};

	const handleTip = async () => {
		const amount = getTipAmount();
		if (amount <= 0) return;

		setIsProcessing(true);

		try {
			// Create checkout configuration for in-app purchase
			const response = await fetch('/api/checkout-config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					companyId: experience.company?.id,
					amount: amount,
					metadata: {
						experienceId: experience.id,
						tipperId: user?.id,
						experienceName: experience.title || 'Tip Jar',
						tipperName: displayName,
					},
				}),
			});

			const checkoutData = await response.json();
			
			if (!checkoutData.success) {
				throw new Error(checkoutData.error || 'Failed to create checkout configuration');
			}

			const checkoutConfig = checkoutData.data;

			// Use iframe SDK to trigger in-app purchase
			const result = await iframeSdk.inAppPurchase({
				planId: checkoutConfig.plan.id,
				id: checkoutConfig.id,
			});

			if (result.status === 'ok') {
				console.log('Payment successful:', result.data);
				// Show success message and record payment amount
				setShowSuccess(true);
				setLastPaymentAmount(amount);
				setTimeout(() => {
					setShowSuccess(false);
				}, 5000); // Hide after 5 seconds
			} else {
				console.error('Payment failed:', result);
				// Handle payment error
			}

		} catch (error) {
			console.error('Error processing tip:', error);
			// Show error message to user
		} finally {
			setIsProcessing(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
					className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
				/>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#0a0a0a] text-[#ffffff] p-2">
			{/* Success Message Overlay */}
			<AnimatePresence>
				{showSuccess && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.8, opacity: 0 }}
							transition={{ type: "spring", stiffness: 300, damping: 30 }}
							className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-2xl shadow-2xl max-w-sm mx-4"
						>
							<div className="text-center">
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: [0, 1] }}
									transition={{ type: "spring", stiffness: 400, damping: 25 }}
								>
									<div className="text-6xl mb-4">🎉</div>
								</motion.div>
								<h3 className="text-2xl font-bold text-white mb-2">
									Tip Successful!
								</h3>
								<p className="text-lg text-white mb-4">
									Thank you for your generous tip of ${lastPaymentAmount?.toFixed(2) || ''}!
								</p>
								<div className="flex gap-3 justify-center">
									<motion.button
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 20 }}
										transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
										onClick={() => setShowSuccess(false)}
										className="mt-6 px-6 py-3 bg-white text-emerald-600 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
									>
										Close
									</motion.button>
									<motion.button
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 20 }}
										transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
										onClick={() => setShowSuccess(false)}
										className="mt-6 px-6 py-3 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-900 transition-colors flex items-center gap-2"
									>
										<ExternalLink className="w-4 h-4" />
										Back to Tipping
									</motion.button>
								</div>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Admin Banner - Only show to owners */}
			{isOwner && (
				<div className="bg-gray-900/80 backdrop-blur-sm">
					<div className="max-w-7xl mx-auto px-4 py-3">
					<div className="flex items-center justify-center">
						<div className="flex items-center gap-3">
							<Settings className="w-4 h-4 text-gray-400 text-[#888888]" />
							<span className="text-gray-300 text-sm text-[#888888]">
								Admin features are available in your dashboard.
							</span>
						</div>
					</div>
					</div>
				</div>
			)}

					<div className="max-w-md mx-auto space-y-6 pt-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center space-y-4"
				>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
						className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-2 shadow-lg shadow-orange-500/25"
					>
						<Heart className="w-8 h-8 text-white" />
					</motion.div>
					<h1 className="text-3xl font-bold text-[#ffffff]">
						Tip Jar 💝
					</h1>
					<p className="text-[#888888] text-lg">
						{tipConfig?.welcomeMessage || 'Thank you for your support! 🙏'}
					</p>
				</motion.div>

				{/* Tip Amount Selection */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.3 }}
					className="space-y-4"
				>
					<h2 className="text-xl font-semibold text-[#ffffff] text-center">
						Choose your tip amount
					</h2>

					{/* Preset Amounts - Compact Chip Layout */}
					<div className="grid grid-cols-3 gap-2 sm:gap-3">
						{(tipConfig?.tipAmounts || [10, 20, 50]).map((amount, index) => (
							<motion.button
								key={amount}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 * index, type: "spring", stiffness: 150 }}
								onClick={() => handleTipSelect(amount)}
								className={`relative px-3 py-2 sm:px-4 sm:py-3 rounded-lg border-2 transition-all duration-200 font-semibold text-sm sm:text-base ${
									selectedAmount === amount
										? 'border-orange-500 bg-gradient-to-r from-orange-500/20 to-orange-600/20 shadow-lg shadow-orange-500/30'
										: 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-orange-400 hover:bg-orange-950/30'
								}`}
							>
								<AnimatePresence>
									{selectedAmount === amount && (
										<motion.div
											layoutId="selectedChip"
											className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-orange-600/30 rounded-lg"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											transition={{ type: "spring", stiffness: 300, damping: 30 }}
										/>
									)}
								</AnimatePresence>
								<div className="relative flex items-center justify-center gap-1">
									<DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${
										selectedAmount === amount ? 'text-orange-400' : 'text-[#888888]'
									}`} />
									<span className={`font-bold ${
										selectedAmount === amount ? 'text-orange-400' : 'text-[#ffffff]'
									}`}>
										{amount}
									</span>
								</div>
							</motion.button>
						))}
					</div>

					{/* Custom Amount Input */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.5 }}
						className="space-y-2"
					>
						<label className="block text-sm font-medium text-[#888888]">
							Or enter custom amount
						</label>
						<div className="relative">
							<DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888888]" />
							<input
								type="number"
								value={customAmount}
								onChange={(e) => handleCustomAmountChange(e.target.value)}
								placeholder="25.00"
								min="1"
								step="0.01"
								className="w-full pl-10 pr-4 py-2.5 border border-[#2a2a2a] rounded-lg bg-[#1a1a1a] text-[#ffffff] focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 transition-all duration-200 text-base placeholder:text-[#888888]/60"
							/>
						</div>
					</motion.div>

					{/* Tip Button */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6 }}
						className="pt-2"
					>
						<button
							onClick={handleTip}
							disabled={isProcessing || getTipAmount() <= 0}
							className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all duration-200 px-6 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2"
						>
							{isProcessing ? (
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
									className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
								/>
							) : (
								<>
									<Sparkles className="w-5 h-5" />
									Send ${getTipAmount().toFixed(2)} Tip
								</>
							)}
						</button>
					</motion.div>
				</motion.div>

				{/* Footer */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.8 }}
					className="text-center text-sm text-[#888888] pt-4 border-t border-[#2a2a2a]"
				>
					<p>
						Powered by Whop
					</p>
				</motion.div>
			</div>
		</div>
	);
}
