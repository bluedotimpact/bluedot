import clsx from 'clsx';

export type FooterProps = React.PropsWithChildren<{
  className?: string,
  logo?: string
}>;

export const Footer: React.FC<FooterProps> = ({ className, logo }) => {
  return (
    <footer className={clsx('footer bg-bluedot-normal text-white min-h-[397] p-8 flex flex-col', className)}>
      <div className="footer_content flex flex-col mb-16">
        {logo ? <img className="footer_logo h-6 mr-auto" src={logo} alt="BlueDot Impact Logo" /> : <p className="footer_logo h-8 mr-auto text-xl text-white">BlueDot Impact</p>}
      </div>
      <p className="footer_copyright text-sm text-center text-bluedot-lighter">&copy; {new Date().getFullYear()} BlueDot Impact is primarily funded by Open Philanthropy, and is a non-profit based in the UK (company number 14964572).</p>
    </footer>
  );
};

export default Footer;
