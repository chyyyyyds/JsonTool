import Link from "next/link";
import LinkButton, { type Href } from "@/components/LinkButton";
// import GitHub from "@/components/icons/GitHub";
import Logo from "@/components/icons/Logo";
// import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Typography from "@/components/ui/typography";
// import AccountButton from "@/containers/editor/sidenav/AccountButton";
import { isCN } from "@/lib/env";
import { useTranslations } from "next-intl";

export default function Header() {
  const t = useTranslations("Home");
  const items: { href: Href; title: string }[] = [
    { href: "/tutorial", title: t("Tutorial") },
  ];

  return (
    <div className="sticky top-0 z-10 bg-white flex md:h-12 h-14 items-center justify-center w-full border-b">
      <nav className="flex items-center w-full h-full max-w-page-header md:px-8 px-4">
        <Link prefetch={false} href="/" className="flex items-center gap-2 pointer mr-2">
          <Logo />
          <span className="font-bold">{"JSON For You"}</span>
        </Link>
        {/* remove version badge */}
        <div className="md:flex hidden items-center gap-4 ml-4">
          {items.map((item) => (
            <Link
              prefetch={false}
              href={item.href as Href}
              key={item.title}
              className="pointer block w-fit hover:text-sky-500"
              target={item.href.startsWith("/") ? "" : "_blank"}
            >
              <Typography variant="p" className="text-primary">
                {item.title}
              </Typography>
            </Link>
          ))}
        </div>
        <div className="ml-auto" />
        <div className="flex items-center h-full py-3 gap-4">
          {/* remove login button */}
          <LinkButton href="/editor" variant="default">
            {t("Editor")}
          </LinkButton>
          <Separator className="md:flex hidden" orientation="vertical" />
          {/* remove github link */}
        </div>
      </nav>
    </div>
  );
}
