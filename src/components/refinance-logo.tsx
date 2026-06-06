type Props = {
  className?: string;
  title?: string;
};

// eslint-disable-next-line @next/next/no-img-element
export function RefinanceLogo({ className, title = 'Refinance' }: Props) {
  return (
    <img
      src="/logo-refinance.png"
      alt={title}
      className={className}
      width={128}
      height={128}
    />
  );
}
