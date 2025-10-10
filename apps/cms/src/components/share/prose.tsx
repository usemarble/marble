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
        "prose dark:prose-invert mx-auto prose-img:rounded-xl prose-p:text-justify prose-h1:font-bold prose-headings:font-abc-favorit prose-headings:font-normal prose-h1:text-xl prose-a:hover:text-primary",
        className
      )}
    >
      {html ? <div dangerouslySetInnerHTML={{ __html: html }} /> : children}
    </article>
  );
}

export default Prose;
