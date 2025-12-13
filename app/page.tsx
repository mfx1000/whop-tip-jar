import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import Link from "next/link";
import { Button } from "@whop/react/components";

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default async function HomePage() {
	try {
		// Try to get user info without requiring a specific experience/company
		const headersList = await headers();
		const { userId } = await whopsdk.verifyUserToken(headersList);
		
		if (userId) {
			const user = await whopsdk.users.retrieve(userId);
			const displayName = user.name || `@${user.username}`;

			return (
				<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
					<div className="max-w-4xl mx-auto text-center">
						<h1 className="text-4xl font-bold text-gray-900 mb-4">
							TipJar App 🎉
						</h1>
						<p className="text-xl text-gray-600 mb-8">
							Welcome to your TipJar! This app allows community members to tip you directly.
						</p>
						
						<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
							<h2 className="text-2xl font-semibold text-gray-900 mb-4">
								App Information
							</h2>
							<div className="text-left space-y-2">
								<p><strong>Logged in as:</strong> {displayName}</p>
								<p><strong>User ID:</strong> {userId}</p>
								<p><strong>Status:</strong> <span className="text-green-600">✅ Connected</span></p>
							</div>
						</div>

						<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
							<h2 className="text-2xl font-semibold text-gray-900 mb-4">
								How to Use TipJar
							</h2>
							<div className="text-left space-y-4">
								<div>
									<h3 className="text-lg font-medium text-gray-900 mb-2">🎯 For Members:</h3>
									<p className="text-gray-600">
										Visit your Whop community and click on the TipJar app to send tips to the creator.
									</p>
								</div>
								<div>
									<h3 className="text-lg font-medium text-gray-900 mb-2">⚙️ For Creators:</h3>
									<p className="text-gray-600">
										Access your dashboard to configure tip amounts and view analytics.
									</p>
								</div>
							</div>
						</div>

						<div className="text-sm text-gray-500">
							<p>
								Note: The experience and company URLs need real Whop IDs to work properly.
								Your current IDs are formatted for testing.
							</p>
						</div>
					</div>
				</div>
			);
		} else {
			return (
				<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
					<div className="max-w-4xl mx-auto text-center">
						<h1 className="text-4xl font-bold text-gray-900 mb-4">
							TipJar App 🔒
						</h1>
						<p className="text-xl text-red-600">
							Please log in to Whop to use this app.
						</p>
					</div>
				</div>
			);
		}
	} catch (error) {
		console.error('Error in home page:', error);
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
				<div className="max-w-4xl mx-auto text-center">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						TipJar App ⚠️
					</h1>
					<p className="text-xl text-red-600">
						Please access this app through Whop to see your TipJar interface.
					</p>
					<p className="text-gray-600 mt-4">
						Error: {error instanceof Error ? error.message : 'Unknown error'}
					</p>
				</div>
			</div>
		);
	}
}
