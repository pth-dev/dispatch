# React Core Rules

- Use React 19 with TypeScript 7 and Vite
- Use React Router for navigation
- Use TanStack Query for data fetching
- Prefer functional components

## Component Design
- Keep components under 100 lines
- Follow single responsibility principle
- Split large components
- Separate logic in custom hooks
- `ref` is a regular prop in React 19 — no `forwardRef`, accept `ref` directly in the component's props

## State
- Avoid props drilling
- Minimize useEffect
- Never setState inside useEffect for derived state

## Performance
- Do not use useMemo/useCallback/React.memo
- React Compiler handles memoization