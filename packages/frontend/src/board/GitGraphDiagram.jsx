import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false });

let renderCounter = 0;

export function GitGraphDiagram({ script }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const id = `git-graph-${renderCounter++}`;
        const { svg } = await mermaid.render(id, script);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [script]);

  if (error) {
    return <p className="board-empty">Failed to render diagram: {error}</p>;
  }

  return <div className="git-graph-diagram" ref={containerRef} />;
}
