import Footer from "@/components/footer";
import Header from "@/components/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] ">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
