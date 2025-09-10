import { NewText } from '@bluedot/ui';

const { H2, H3, P } = NewText;

const valueCards = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25.9941 15.4938L22.4941 18.9938C22.3299 19.158 22.1072 19.2502 21.875 19.2502C21.6428 19.2502 21.4201 19.158 21.2559 18.9938C21.0918 18.8296 20.9995 18.6069 20.9995 18.3747C20.9995 18.1425 21.0918 17.9198 21.2559 17.7556L23.263 15.7497H13.487L7.36203 21.8747H10.5C10.7321 21.8747 10.9546 21.9669 11.1187 22.131C11.2828 22.2951 11.375 22.5176 11.375 22.7497C11.375 22.9818 11.2828 23.2043 11.1187 23.3684C10.9546 23.5325 10.7321 23.6247 10.5 23.6247H5.25C5.01794 23.6247 4.79538 23.5325 4.63128 23.3684C4.46719 23.2043 4.375 22.9818 4.375 22.7497V17.4997C4.375 17.2676 4.46719 17.0451 4.63128 16.881C4.79538 16.7169 5.01794 16.6247 5.25 16.6247C5.48206 16.6247 5.70462 16.7169 5.86872 16.881C6.03281 17.0451 6.125 17.2676 6.125 17.4997V20.6377L12.25 14.5127V4.73674L10.2441 6.74377C10.0799 6.90796 9.85719 7.0002 9.625 7.0002C9.39281 7.0002 9.17012 6.90796 9.00594 6.74377C8.84175 6.57959 8.74951 6.3569 8.74951 6.12471C8.74951 5.89252 8.84175 5.66983 9.00594 5.50565L12.5059 2.00565C12.5872 1.92429 12.6837 1.85976 12.7899 1.81572C12.8961 1.77169 13.01 1.74902 13.125 1.74902C13.24 1.74902 13.3538 1.77169 13.4601 1.81572C13.5663 1.85976 13.6628 1.92429 13.7441 2.00565L17.2441 5.50565C17.4082 5.66983 17.5005 5.89252 17.5005 6.12471C17.5005 6.3569 17.4082 6.57959 17.2441 6.74377C17.0799 6.90796 16.8572 7.0002 16.625 7.0002C16.3928 7.0002 16.1701 6.90796 16.0059 6.74377L14 4.73674V13.9997H23.263L21.2559 11.9938C21.0918 11.8296 20.9995 11.6069 20.9995 11.3747C20.9995 11.1425 21.0918 10.9198 21.2559 10.7556C21.4201 10.5915 21.6428 10.4992 21.875 10.4992C22.1072 10.4992 22.3299 10.5915 22.4941 10.7556L25.9941 14.2556C26.0754 14.3369 26.14 14.4334 26.184 14.5396C26.228 14.6459 26.2507 14.7597 26.2507 14.8747C26.2507 14.9897 26.228 15.1036 26.184 15.2098C26.14 15.316 26.0754 15.4125 25.9941 15.4938Z" fill="white" />
      </svg>
    ),
    title: 'Simulations, Not Slides',
    description: 'No lectures. No PowerPoints. Practice real strategic decision-making through crisis simulations, case studies, and interactive scenarios.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Your Strategic Action Plan',
    description: 'Don\'t just understand the problem—develop your personal roadmap for contributing to AGI governance based on your skills and interests.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89317 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Access to Active Players',
    description: 'Connect with people already working on AGI governance in government, industry, and research—your future colleagues and collaborators.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 16V8C20.9996 7.64927 20.9071 7.30481 20.7315 7.00116C20.556 6.69751 20.3037 6.44536 20 6.27L13 2.27C12.696 2.09446 12.3511 2.00205 12 2.00205C11.6489 2.00205 11.304 2.09446 11 2.27L4 6.27C3.69626 6.44536 3.44398 6.69751 3.26846 7.00116C3.09294 7.30481 3.00036 7.64927 3 8V16C3.00036 16.3507 3.09294 16.6952 3.26846 16.9988C3.44398 17.3025 3.69626 17.5546 4 17.73L11 21.73C11.304 21.9055 11.6489 21.9979 12 21.9979C12.3511 21.9979 12.696 21.9055 13 21.73L20 17.73C20.3037 17.5546 20.556 17.3025 20.7315 16.9988C20.9071 16.6952 20.9996 16.3507 21 16Z" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7.5 4.21L12 6.81L16.5 4.21M12 22.08V12M12 6.81L3.27 2.04" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Frameworks That Matter',
    description: 'Learn the actual models and frameworks being used by policymakers and researchers to think about AGI timelines, risks, and governance.',
  },
];

const WhyTakeThisCourseSection = () => {
  return (
    <section className="w-full border-t-[0.5px] border-color-divider bg-white">
      <div className="max-w-max-width mx-auto px-spacing-x py-16">
        <H2 className="text-[36px] font-semibold leading-tight text-[#13132E] text-center mb-16">
          Why take this course
        </H2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {valueCards.map(({ icon, title, description }) => (
            <div key={title} className="flex flex-col gap-6">
              <div className="size-11 bg-[#2244BB] rounded-lg flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div className="space-y-2">
                <H3 className="text-[18px] font-semibold leading-tight text-[#13132E]">
                  {title}
                </H3>
                <P className="text-size-sm leading-[1.6] text-[#13132E] opacity-80">
                  {description}
                </P>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyTakeThisCourseSection;
