import classNames from 'clsx';
import Link from './Link';

interface Props {
  href?: string,
  target?: React.HTMLAttributeAnchorTarget,
  onClick?: React.EventHandler<React.MouseEvent | React.KeyboardEvent>,
  className?: string,
  disabled?: boolean,
  children?: React.ReactNode,
}

const Button: React.FC<Props> = ({
  children, href, target, onClick, className, disabled, ...other
}) => (
  <Link
    href={href}
    target={target}
    onClick={onClick}
    className={classNames('py-2 px-4 rounded text-white inline-block h-full transition-all duration-200 bg-blue-400 hover:brightness-95 focus:brightness-95 focus:ring-4 ring-blue-200 outline-none', className)}
    disabled={disabled}
    role="button"
    {...other}
  >
    <span className="inline-block">{children}</span>
  </Link>
);

export default Button;
