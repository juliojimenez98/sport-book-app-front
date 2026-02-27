import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
  href?: string | null;
}

export function Logo({
  className,
  imageClassName,
  textClassName,
  showText = true,
  href = "/",
}: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative h-10 w-10 shrink-0", imageClassName)}>
        <Image
          src="/logo.png"
          alt="Easy Sport Book Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn("text-xl font-bold gradient-text", textClassName)}>
          Easy Sport Book
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
