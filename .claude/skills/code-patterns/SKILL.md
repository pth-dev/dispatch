---
name: code-patterns
description: Use when writing or reviewing component props, callbacks, mapped list rendering, or ref forwarding in React. Shows DO/DON'T examples for inline callback length, extracting mapped components, and passing ref as a prop.
---

# Code Patterns

- Avoid passing long inline callbacks as props; when the callback is longer than 4 lines, create a separate function and pass the function

#### DON'T
```tsx
return <MyComponent
  onPress={(value) => {
    const items = getItems(value)
    const result = items.filter(somePredicate)
    if (result.length === 0) {
      setSomeOtherState(0)
    }
    setState(result.map(r => r.name))
  }}
/>

```
#### DO
```tsx
const handleOnPress = (value) => {
  const items = getItems(value)
  const result = items.filter(somePredicate)
  if (result.length === 0) {
    setSomeOtherState(0)
  }
  setState(result.map(r => r.name))
}
return <MyComponent onPress={handleOnPress} />
```

- Create the smaller primitive UI components first (buttons, inputs, selects, checkboxes, cards, and so on), then reuse them in larger and more specialized components
- When mapping items to return a component, create a separate component and do not inline it when it is longer than 6 lines

#### DON'T
```tsx
items.map(item => {
  const description = getDescriptionFromItem(item)
  return (
    <div key={item.id}>
      <h2>Some title</h2>
      <div>
        <p>Some description: {description}</p>
      </div>
    </div>
  )
})
```

#### DO
```tsx
items.map(item => <MappedItem key={item.id} item={item} />)
  ```

  - Never call `setState` synchronously inside a `useEffect` body to reset/derive state from other state — this causes cascading renders. Instead, move the reset logic into the event handler that triggers the state change.

#### DON'T
```tsx
const [selectedId, setSelectedId] = useState('')
const [targets, setTargets] = useState({})

useEffect(() => {
  if (!selectedId) setTargets({}) // cascading render
}, [selectedId])
```

#### DO
```tsx
const [selectedId, setSelectedId] = useState('')
const [targets, setTargets] = useState({})

const handleSelectChange = (id: string) => {
  setSelectedId(id)
  if (!id) setTargets({})
}
```

- React 19 passes `ref` as a normal prop — don't wrap components in `forwardRef`

#### DON'T
```tsx
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  return <input ref={ref} {...props} />
})
```

#### DO
```tsx
type InputProps = ComponentProps<'input'>

const Input = ({ ref, ...props }: InputProps) => {
  return <input ref={ref} {...props} />
}
```
