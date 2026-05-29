import { useInView } from '../../hooks';

export default function AnimSection({ children, className = '', style = {}, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity:   inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(36px)',
      transition:`opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}
