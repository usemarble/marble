"use client";
import { Folder } from "@/components/icons";
import { buttonVariants } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Plus } from "lucide-react";
import Link from "next/link";

interface PageClientProps {
  articles: { title: string; id: string; description: string | null }[];
  site: string;
}

function PageClient({ articles, site }: PageClientProps) {
  return (
    <section className="h-full flex flex-col">
      {articles.length > 0 ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {articles.map((article) => (
            <li key={article.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>view site</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid h-full w-full place-content-center">
          <div className="flex flex-col items-center">
            <Folder className="size-40 text-primary" />
            <div className="flex flex-col items-center gap-10">
              <p className="text-balance max-w-2xl mx-auto text-center">
                No articles yet. Click the button below to start writing.
              </p>
              <Link
                href={`/${site}/new`}
                className={buttonVariants({
                  className:
                    "hover:ring-primary group flex items-center gap-2 px-8 py-2 text-sm capitalize transition-all duration-300 ease-out hover:ring-2 hover:ring-offset-2",
                })}
              >
                <Plus size={16} />
                <span>New site</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default PageClient;
