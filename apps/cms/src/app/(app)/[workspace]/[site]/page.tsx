async function Page(props: { params: Promise<{ site: string }> }) {
  const params = await props.params;
  const { site } = params;

  return (
    <div className="flex h-screen flex-col gap-4">
      <section className="bg-background/90 w-full backdrop-blur-lg">
        <h1 className="text-center text-2xl font-bold capitalize">{site}</h1>
      </section>

      <section>
        <div>List of blogs for {site}</div>
      </section>
    </div>
  );
}

export default Page;
