// This is just a sample component, that will likely be deleted
// It represents a component we could pass props to - we can use the same pattern for e.g. MCQs, free-text exercise responses, demo embeds, video embeds, ...
const Greeting: React.FC<React.PropsWithChildren> = ({ children }) => <p>Hello {children}</p>;

export default Greeting;
