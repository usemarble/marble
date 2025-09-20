/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: <> */
import { cn } from "@marble/ui/lib/utils";

type ProseProps = React.HTMLAttributes<HTMLElement> & {
  as?: "article";
  html?: string;
};

function Prose({ children, html, className }: ProseProps) {
  return (
    <article
      className={cn(
        "prose dark:prose-invert prose-h1:font-bold prose-h1:text-xl prose-a:hover:text-primary prose-p:text-justify prose-img:rounded-xl prose-headings:font-abc-favorit prose-headings:font-normal mx-auto",
        className,
      )}
    >
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : children}
    </article>
  );
}

export default Prose;
