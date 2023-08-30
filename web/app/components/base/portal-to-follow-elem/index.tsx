'use client'
import React from 'react'
import {
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
} from '@floating-ui/react'

import type { Placement } from '@floating-ui/react'

type PortalToFollowElemOptions = {
  initialOpen?: boolean
  placement?: Placement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function usePortalToFollowElem({
  placement = 'bottom-end',
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: PortalToFollowElemOptions = {}) {
  const open = controlledOpen
  const setOpen = setControlledOpen

  const data = useFloating({
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: 'start',
        padding: 5,
      }),
      shift({ padding: 5 }),
    ],
  })

  const context = data.context

  const hover = useHover(context, {
    move: false,
    enabled: controlledOpen == null,
  })
  const focus = useFocus(context, {
    enabled: controlledOpen == null,
  })
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })

  const interactions = useInteractions([hover, focus, dismiss, role])

  return React.useMemo(
    () => ({
      open,
      setOpen,
      ...interactions,
      ...data,
    }),
    [open, setOpen, interactions, data],
  )
}

type ContextType = ReturnType<typeof usePortalToFollowElem> | null

const PortalToFollowElemContext = React.createContext<ContextType>(null)

export function usePortalToFollowElemContext() {
  const context = React.useContext(PortalToFollowElemContext)

  if (context == null)
    throw new Error('PortalToFollowElem components must be wrapped in <PortalToFollowElem />')

  return context
}

export function PortalToFollowElem({
  children,
  ...options
}: { children: React.ReactNode } & PortalToFollowElemOptions) {
  // This can accept any props as options, e.g. `placement`,
  // or other positioning options.
  const tooltip = usePortalToFollowElem(options)
  return (
    <PortalToFollowElemContext.Provider value={tooltip}>
      {children}
    </PortalToFollowElemContext.Provider>
  )
}

export const PortalToFollowElemTrigger = React.forwardRef<
HTMLElement,
React.HTMLProps<HTMLElement> & { asChild?: boolean }
>(({ children, asChild = false, ...props }, propRef) => {
  const context = usePortalToFollowElemContext()
  const childrenRef = (children as any).ref
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef])

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children,
      context.getReferenceProps({
        ref,
        ...props,
        ...children.props,
        'data-state': context.open ? 'open' : 'closed',
      }),
    )
  }

  return (
    <button
      ref={ref}
      // The user can style the trigger based on the state
      data-state={context.open ? 'open' : 'closed'}
      {...context.getReferenceProps(props)}
    >
      {children}
    </button>
  )
})
PortalToFollowElemTrigger.displayName = 'PortalToFollowElemTrigger'

export const PortalToFollowElemContent = React.forwardRef<
HTMLDivElement,
React.HTMLProps<HTMLDivElement>
>(({ style, ...props }, propRef) => {
  const context = usePortalToFollowElemContext()
  const ref = useMergeRefs([context.refs.setFloating, propRef])

  if (!context.open)
    return null

  return (
    <FloatingPortal>
      <div
        ref={ref}
        style={{
          ...context.floatingStyles,
          ...style,
        }}
        {...context.getFloatingProps(props)}
      />
    </FloatingPortal>
  )
})

PortalToFollowElemContent.displayName = 'PortalToFollowElemContent'
