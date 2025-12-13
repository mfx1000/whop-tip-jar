import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import TipJarDashboard from "@/components/TipJarDashboard";

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const { companyId } = await params;
	// Ensure that user is logged in on whop.
	const headersList = await headers();
	const { userId } = await whopsdk.verifyUserToken(headersList);

	// Fetch necessary data we want from whop.
	const [company, user, access] = await Promise.all([
		whopsdk.companies.retrieve(companyId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(companyId, { id: userId }),
	]);

	const displayName = user.name || `@${user.username}`;

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
			<div className="max-w-6xl mx-auto">
				<TipJarDashboard 
					companyId={companyId}
					userId={userId}
					displayName={displayName}
				/>
			</div>
		</div>
	);
}
