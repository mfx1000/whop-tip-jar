'use client';

import { useState, useEffect } from 'react';
import { Button } from "@whop/react/components";
import { motion } from 'framer-motion';
import { Settings, TrendingUp, Users, DollarSign, Calendar, Download, Plus, X } from 'lucide-react';

interface TipJarDashboardProps {
	companyId: string;
	userId: string;
	displayName: string;
}

interface TipAnalytics {
	totalTips: number;
	totalCreatorEarnings: number;
	totalDeveloperEarnings: number;
	tipCount: number;
	averageTipAmount: number;
	lastUpdated: string;
}

interface TipTransaction {
	id: string;
	fromUsername: string;
	amount: number;
	creatorAmount: number;
	status: string;
	createdAt: string;
}

interface TipConfig {
	tipAmounts: number[];
	welcomeMessage: string;
}

export default function TipJarDashboard({ 
	companyId, 
	userId, 
	displayName 
}: TipJarDashboardProps) {
	const [analytics, setAnalytics] = useState<TipAnalytics | null>(null);
	const [transactions, setTransactions] = useState<TipTransaction[]>([]);
	const [config, setConfig] = useState<TipConfig | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [pagination, setPagination] = useState({
		limit: 10,
		offset: 0,
		hasMore: true
	});
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [tempConfig, setTempConfig] = useState<TipConfig>({
		tipAmounts: [10, 20, 50],
		welcomeMessage: 'Thank you for your support! 🙏'
	});

	useEffect(() => {
		fetchData();
	}, [companyId]);

	const fetchData = async () => {
		try {
			const [analyticsRes, transactionsRes, configRes] = await Promise.all([
				fetch(`/api/tip-analytics?companyId=${companyId}`),
				fetch(`/api/tip-history?companyId=${companyId}&limit=${pagination.limit}&offset=${pagination.offset}`),
				fetch(`/api/tip-config?companyId=${companyId}`)
			]);

			const analyticsData = await analyticsRes.json();
			const transactionsData = await transactionsRes.json();
			const configData = await configRes.json();

			setAnalytics(analyticsData.data);
			setTransactions(transactionsData.data || []);
			if (transactionsData.pagination) {
				setPagination(prev => ({
					...prev,
					hasMore: transactionsData.pagination.hasMore
				}));
			}
			if (configData.data && configData.data.tipAmounts) {
				setConfig(configData.data);
				setTempConfig({
					tipAmounts: configData.data.tipAmounts,
					welcomeMessage: configData.data.welcomeMessage
				});
			}
		} catch (error) {
			console.error('Error fetching dashboard data:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const loadMoreTransactions = async () => {
		if (isLoadingMore || !pagination.hasMore) return;

		setIsLoadingMore(true);
		try {
			const newOffset = pagination.offset + pagination.limit;
			// Load 5 more records at a time for "Load More" functionality
			const loadMoreLimit = 5;
			const response = await fetch(
				`/api/tip-history?companyId=${companyId}&limit=${loadMoreLimit}&offset=${newOffset}`
			);
			const data = await response.json();

			if (data.data && data.data.length > 0) {
				setTransactions(prev => [...prev, ...data.data]);
				setPagination(prev => ({
					...prev,
					offset: newOffset,
					hasMore: data.pagination?.hasMore || false
				}));
			} else {
				setPagination(prev => ({ ...prev, hasMore: false }));
			}
		} catch (error) {
			console.error('Error loading more transactions:', error);
		} finally {
			setIsLoadingMore(false);
		}
	};

	const formatDate = (dateString: string) => {
		try {
			// Parse the ISO string (now properly formatted from API)
			const date = new Date(dateString);
			
			// Check if date is valid
			if (isNaN(date.getTime())) {
				console.log('Invalid date detected:', dateString);
				return 'Invalid date';
			}

			return date.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			});
		} catch (error) {
			console.log('Date parsing error:', error, dateString);
			return 'Invalid date';
		}
	};

	const handleSaveConfig = async () => {
		setIsSaving(true);
		try {
			const response = await fetch('/api/tip-config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					companyId,
					tipAmounts: tempConfig.tipAmounts,
					welcomeMessage: tempConfig.welcomeMessage
				}),
			});

			if (response.ok) {
				const newConfig = await response.json();
				setConfig(newConfig.data);
				setEditMode(false);
			}
		} catch (error) {
			console.error('Error saving config:', error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleAmountChange = (index: number, value: string) => {
		const newAmounts = [...tempConfig.tipAmounts];
		newAmounts[index] = parseFloat(value) || 0;
		setTempConfig({ ...tempConfig, tipAmounts: newAmounts });
	};

	const addTipAmount = () => {
		setTempConfig({
			...tempConfig,
			tipAmounts: [...tempConfig.tipAmounts, 25]
		});
	};

	const removeTipAmount = (index: number) => {
		if (tempConfig.tipAmounts.length > 1) {
			const newAmounts = tempConfig.tipAmounts.filter((_, i) => i !== index);
			setTempConfig({ ...tempConfig, tipAmounts: newAmounts });
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
		<div className="min-h-screen bg-[#0a0a0a] text-[#ffffff] p-4">
			<div className="max-w-7xl mx-auto space-y-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center space-y-4"
				>
					<h1 className="text-4xl font-bold text-[#ffffff] mb-2">
						Tip Jar Dashboard
					</h1>
					<p className="text-xl text-[#888888]">
						Manage your tip settings and view analytics
					</p>
				</motion.div>

				{/* Analytics Cards - Only 3 Horizontal Cards */}
				<motion.div
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ delay: 0.2 }}
					className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
				>
					<div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-[#2a2a2a] hover:border-orange-500/30 transition-all duration-200">
						<div className="flex items-center justify-between mb-2">
							<TrendingUp className="w-5 h-5 text-orange-400" />
							<span className="text-sm text-[#888888]">Your Earnings</span>
						</div>
						<div className="text-2xl font-bold text-[#ffffff]">
							${analytics?.totalCreatorEarnings.toFixed(2) || '0.00'}
						</div>
					</div>

					<div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-[#2a2a2a] hover:border-orange-500/30 transition-all duration-200">
						<div className="flex items-center justify-between mb-2">
							<Users className="w-5 h-5 text-orange-400" />
							<span className="text-sm text-[#888888]">Total Tips</span>
						</div>
						<div className="text-2xl font-bold text-[#ffffff]">
							{analytics?.tipCount || 0}
						</div>
					</div>

					<div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-[#2a2a2a] hover:border-orange-500/30 transition-all duration-200">
						<div className="flex items-center justify-between mb-2">
							<DollarSign className="w-5 h-5 text-orange-500" />
							<span className="text-sm text-[#888888]">Average Tip</span>
						</div>
						<div className="text-2xl font-bold text-[#ffffff]">
							${analytics?.averageTipAmount.toFixed(2) || '0.00'}
						</div>
					</div>
				</motion.div>

				{/* Configuration Panel - Compact Design */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-[#2a2a2a] max-w-4xl mx-auto"
				>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-semibold text-[#ffffff] flex items-center gap-2">
							<Settings className="w-5 h-5 text-orange-400" />
							Tip Configuration
						</h2>
						<Button
							onClick={() => {
								if (editMode) {
									setTempConfig({
										tipAmounts: config?.tipAmounts || [10, 20, 50],
										welcomeMessage: config?.welcomeMessage || 'Thank you for your support! 🙏'
									});
								}
								setEditMode(!editMode);
							}}
							variant="classic"
							size="2"
							className="bg-[#2a2a2a] hover:bg-[#333333] text-[#ffffff] border-[#444444]"
						>
							{editMode ? 'Cancel' : 'Edit'}
						</Button>
					</div>

					{editMode ? (
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
							{/* Tip Amounts Section */}
							<div className="space-y-4">
								<label className="block text-sm font-medium text-[#888888] mb-2">
									Tip Amounts ($)
								</label>
								<div className="space-y-2">
									{tempConfig.tipAmounts.map((amount, index) => (
										<div key={index} className="flex items-center gap-2">
											<input
												type="number"
												value={amount}
												onChange={(e) => handleAmountChange(index, e.target.value)}
												min="1"
												step="0.01"
												className="flex-1 px-3 py-2 border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-[#ffffff] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-sm"
											/>
											<Button
												onClick={() => removeTipAmount(index)}
												variant="classic"
												size="1"
												className="bg-red-900/50 hover:bg-red-800/50 text-red-400 border-red-700/50 px-2 py-1"
												disabled={tempConfig.tipAmounts.length <= 1}
											>
												<X className="w-3 h-3" />
											</Button>
										</div>
									))}
								</div>
								<Button
									onClick={addTipAmount}
									variant="classic"
									size="2"
									className="w-full bg-orange-600 hover:bg-orange-700 text-[#ffffff] border-orange-500 flex items-center gap-2"
								>
									<Plus className="w-4 h-4" />
									Add Tip Amount
								</Button>
							</div>

							{/* Welcome Message Section */}
							<div className="space-y-4">
								<label className="block text-sm font-medium text-[#888888] mb-2">
									Welcome Message
								</label>
								<textarea
									value={tempConfig.welcomeMessage}
									onChange={(e) => setTempConfig({ ...tempConfig, welcomeMessage: e.target.value })}
									rows={4}
									className="w-full px-3 py-2 border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] text-[#ffffff] focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 placeholder:text-[#888888]/60 text-sm resize-none"
									placeholder="Thank you for your support! 🙏"
								/>
								<Button
									onClick={handleSaveConfig}
									disabled={isSaving}
									variant="classic"
									size="3"
									className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-[#ffffff] shadow-lg shadow-orange-500/25"
								>
									{isSaving ? 'Saving...' : 'Save Configuration'}
								</Button>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<span className="text-sm text-[#888888]">Tip Amounts:</span>
								<div className="flex flex-wrap gap-2 mt-2">
									{config?.tipAmounts?.map((amount) => (
										<span key={amount} className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium border border-orange-500/30">
											${amount}
										</span>
									))}
								</div>
							</div>
							<div>
								<span className="text-sm text-[#888888]">Welcome Message:</span>
								<p className="text-[#ffffff] mt-2">{config?.welcomeMessage}</p>
							</div>
						</div>
					)}
				</motion.div>

				{/* Transaction History */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-[#2a2a2a] max-w-4xl mx-auto"
				>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-semibold text-[#ffffff] flex items-center gap-2">
							<Calendar className="w-5 h-5 text-orange-400" />
							Recent Tips
						</h2>
						<Button
							onClick={() => {
								const csv = [
									['Username', 'Amount', 'Creator Amount', 'Status', 'Date'],
									...transactions.map(t => [
										t.fromUsername,
										t.amount.toFixed(2),
										t.creatorAmount.toFixed(2),
										t.status,
										new Date(t.createdAt).toLocaleString()
									])
								].map(row => row.join(',')).join('\n');

								const blob = new Blob([csv], { type: 'text/csv' });
								const url = URL.createObjectURL(blob);
								const a = document.createElement('a');
								a.href = url;
								a.download = 'tip-history.csv';
								a.click();
							}}
							variant="classic"
							size="2"
							className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-[#ffffff] border-orange-500"
						>
							<Download className="w-4 h-4" />
							Export CSV
						</Button>
					</div>

					{transactions.length === 0 ? (
						<p className="text-center text-[#888888] py-8">
							No tips received yet. Share your TipJar link to start receiving tips!
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-[#2a2a2a]">
										<th className="text-left py-3 px-4 text-sm font-medium text-[#888888]">Username</th>
										<th className="text-left py-3 px-4 text-sm font-medium text-[#888888]">Amount</th>
										<th className="text-left py-3 px-4 text-sm font-medium text-[#888888]">You Receive</th>
										<th className="text-left py-3 px-4 text-sm font-medium text-[#888888]">Status</th>
										<th className="text-left py-3 px-4 text-sm font-medium text-[#888888]">Date</th>
									</tr>
								</thead>
								<tbody>
									{transactions.map((transaction) => (
										<tr key={transaction.id} className="border-b border-[#1a1a1a] hover:bg-[#2a2a2a]/50 transition-colors duration-150">
											<td className="py-3 px-4 text-sm text-[#ffffff]">{transaction.fromUsername}</td>
											<td className="py-3 px-4 text-sm font-medium text-[#ffffff]">${transaction.amount.toFixed(2)}</td>
											<td className="py-3 px-4 text-sm text-green-400 font-medium">
												${transaction.creatorAmount.toFixed(2)}
											</td>
											<td className="py-3 px-4">
												<span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
													transaction.status === 'completed'
														? 'bg-green-900/50 text-green-400 border border-green-700/50'
														: 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50'
												}`}>
													{transaction.status}
												</span>
											</td>
											<td className="py-3 px-4 text-sm text-[#888888]">
												{formatDate(transaction.createdAt)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
							
							{/* Load More Button */}
							{pagination.hasMore && (
								<div className="mt-6 text-center">
									<Button
										onClick={loadMoreTransactions}
										disabled={isLoadingMore}
										variant="classic"
										size="2"
										className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 disabled:opacity-50 text-[#ffffff] border-orange-500 flex items-center gap-2 mx-auto"
									>
										{isLoadingMore ? (
											<motion.div
												animate={{ rotate: 360 }}
												transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
												className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
											/>
										) : (
											<>
												Load More
											</>
										)}
									</Button>
								</div>
							)}
						</div>
					)}
				</motion.div>
			</div>
		</div>
	);
}
