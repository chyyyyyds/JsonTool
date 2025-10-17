import Link from "next/link";
import { type Href } from "@/components/LinkButton";
// import GitHub from "@/components/icons/GitHub";
import Logo from "@/components/icons/Logo";
// import Twitter from "@/components/icons/Twitter";
// import Weibo from "@/components/icons/Weibo";
import { isCN } from "@/lib/env";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Home");
  const items: FooterLinkProps[] = [];

  return (
    <footer className="flex h-12 items-center justify-center w-full border-t">
      <div className="flex items-center w-full max-w-page-header md:px-8 px-4 gap-x-8 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Logo className="w-[20px] h-[20px] text-slate-500" />
          <span>{"© 2025 JSON For You"}</span>
        </div>
        {/* remove legal links */}
        <div className="ml-auto lg:flex hidden gap-8">
          {items.map((item, i) => (
            <FooterLink key={i} title={item.title} href={item.href} />
          ))}
        </div>
      </div>
    </footer>
  );
}

function Upyun() {
  return (
    <FooterLink
      nofollow
      href="https://www.upyun.com/?utm_source=lianmeng&utm_medium=referral"
      title={
        <div className="inline-flex items-center justify-center h-6">
          <span className="flex">{"本网站由"}</span>
          <img
            src="https://o.json4u.cn/upyun-logo.png"
            className="h-full px-0.5 mx-0.5 bg-blue-500"
            alt="又拍云 logo"
          />
          <span>{"提供CDN加速/云存储服务"}</span>
        </div>
      }
    />
  );
}

function Legal() { return null; }

interface FooterLinkProps {
  href: string;
  title: string | JSX.Element;
  nofollow?: boolean;
}

function FooterLink({ href, title, nofollow }: FooterLinkProps) {
  return (
    <Link
      prefetch={false}
      href={href as Href}
      target={href.startsWith("/") ? "" : "_blank"}
      rel={nofollow ? "nofollow noopener" : "noopener"}
      className="pointer block w-fit hover:text-slate-900"
    >
      {title}
    </Link>
  );
}
