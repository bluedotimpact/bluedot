import Link from './Link';

export interface ActionButtonProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>,
  onClick?: () => void;
  href?: string;
  children: React.ReactNode,
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  href,
  icon: Icon,
  children,
}) => {
  return (
    <Link
      onClick={onClick}
      href={href}
      className="flex flex-row rounded overflow-hidden bg-white items-center border-gray-100 border cursor-pointer hover:brightness-95 focus:brightness-95"
    >
      <div className="bg-blue-100 p-3">
        <div className="p-4 bg-blue-400 rounded">
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
      <div className="p-4 text-2xl font-medium">
        {children}
      </div>
    </Link>
  );
};
