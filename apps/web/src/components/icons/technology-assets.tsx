import Image from 'next/image';
import type { IconBaseProps, IconType } from 'react-icons';

interface AssetIconProps {
  src: string;
  size?: IconBaseProps['size'];
  className?: string;
  wide?: boolean;
}

function AssetIcon({ src, size, className, wide = false }: AssetIconProps) {
  const pixels = typeof size === 'number' && Number.isFinite(size) ? size : 24;

  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={wide ? 1103 : pixels}
      height={wide ? 386 : pixels}
      className={className}
      style={wide ? { width: '2.85em', height: '1em' } : undefined}
    />
  );
}

export const OpenAiIcon: IconType = props => (
  <AssetIcon src="/icons/openai.svg" {...props} />
);

export const SqlServerIcon: IconType = props => (
  <AssetIcon src="/icons/sql-server.svg" {...props} />
);

export const CSharpIcon: IconType = props => (
  <AssetIcon src="/icons/csharp.svg" {...props} />
);

export const MotionIcon: IconType = props => (
  <AssetIcon src="/icons/motion.svg" wide {...props} />
);
