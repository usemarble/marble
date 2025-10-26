"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@marble/ui/components/breadcrumb";
import { usePathname } from "next/navigation";
import React from "react";

const formatSegment = (segment: string) => {
	return segment
		.replace(/-/g, " ")
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

export function AppBreadcrumb() {
	const pathname = usePathname();
	const segments = pathname.split("/").filter(Boolean);

	if (segments.length === 0) {
		return (
			<Breadcrumb>
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbPage className="text-sm">Dashboard</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
		);
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbLink className="text-sm" href="/">
						Dashboard
					</BreadcrumbLink>
				</BreadcrumbItem>
				{segments.map((segment, index) => (
					<React.Fragment key={segment}>
						<BreadcrumbSeparator>
							<span className="select-none">/</span>
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							{index === segments.length - 1 ? (
								<BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
							) : (
								<BreadcrumbLink
									className="text-sm"
									href={`/${segments.slice(0, index + 1).join("/")}`}
								>
									{formatSegment(segment)}
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
