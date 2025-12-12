import { Button } from "@whop/react/components";
import { headers } from "next/headers";
import Link from "next/link";
import { whopsdk } from "@/lib/whop-sdk";
import TipJarExperience from "@/components/TipJarExperience";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;
	
	// Ensure that user is logged in on whop.
	const { userId } = await whopsdk.verifyUserToken(await headers());

	// Fetch the necessary data we want from whop.
	const [experience, user, access] = await Promise.all([
		whopsdk.experiences.retrieve(experienceId),
		whopsdk.users.retrieve(userId),
		whopsdk.users.checkAccess(experienceId, { id: userId }),
	]);

	// Fetch full company data separately to get owner information
	const fullCompany = await whopsdk.companies.retrieve(experience.company?.id || '');

	const displayName = user.name || `@${user.username}`;

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
			<div className="max-w-4xl mx-auto">
				<TipJarExperience 
					experience={experience}
					user={user}
					access={access}
					displayName={displayName}
					userId={userId}
					fullCompany={fullCompany}
				/>
			</div>
		</div>
	);
}
