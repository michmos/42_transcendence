// Type definitions for the Component System
// This module provides comprehensive type safety for the component plugin

// Base component interface that all components must implement
export interface ComponentWithUpdate<TData = unknown> {
  update: (data: TData[]) => void;
}

// Enhanced HTML element with component metadata
export interface ComponentElement extends HTMLElement {
  __component?: ComponentWithUpdate;
  __componentName?: string;
  __componentInitialized?: boolean;
}

// Factory function type for creating components
export type ComponentFactory<TProps = unknown, TData = unknown> = (
  element: HTMLElement,
  props: TProps
) => ComponentWithUpdate<TData>;

// Component registry entry
export interface ComponentRegistryEntry {
  readonly component: ComponentWithUpdate;
  readonly element: HTMLElement;
  readonly name: string;
  readonly props: unknown;
  readonly initializedAt: Date;
}

// Event dispatcher interface
export interface ComponentEventDispatcher {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  dispatchEvent(event: Event): boolean;
}

// Component system API
export interface ComponentSystemAPI {
  readonly get: (elementId: string) => ComponentWithUpdate | undefined;
  readonly getFromElement: (
    element: HTMLElement
  ) => ComponentWithUpdate | undefined;
  readonly refresh: () => void;
  readonly registry: ReadonlyMap<string, ComponentWithUpdate>;
  readonly events: ComponentEventDispatcher;
}

// Component initialization options
export interface ComponentInitializationOptions {
  readonly autoRefresh?: boolean;
  readonly debugMode?: boolean;
  readonly eventPrefix?: string;
}

// Component event detail
export interface ComponentEventDetail {
  readonly componentName: string;
  readonly component: ComponentWithUpdate;
  readonly element?: HTMLElement;
  readonly timestamp?: Date;
}

// Custom events for component lifecycle
export interface ComponentReadyEvent extends CustomEvent {
  readonly detail: ComponentEventDetail;
}

export interface ComponentSystemRefreshEvent extends CustomEvent {
  readonly detail: {
    readonly source: string;
    readonly timestamp?: Date;
  };
}

// Vite plugin options
export interface ComponentTransformOptions {
  readonly componentsDir?: string;
  readonly enableLogging?: boolean;
  readonly fileExtensions?: {
    readonly html?: string;
    readonly script?: string;
  };
}

// Component info for build-time processing
export interface ComponentInfo {
  readonly name: string;
  readonly path: string;
  readonly htmlPath: string;
  readonly tsPath: string;
  readonly attributes?: Record<string, string>;
}

// Component configuration
export interface ComponentConfig {
  readonly name: string;
  readonly factory: ComponentFactory;
  readonly defaultProps?: unknown;
  readonly dependencies?: string[];
}

// Utility types
export type ComponentName = string;
export type ElementId = string;
export type ComponentProps = Record<string, unknown>;

// Type guards
export function isComponentElement(
  element: Element
): element is ComponentElement {
  return (
    element instanceof HTMLElement && element.hasAttribute('data-component')
  );
}

export function isValidComponentName(name: unknown): name is ComponentName {
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    /^[A-Z][a-zA-Z0-9]*$/.test(name)
  );
}

export function hasComponentAttribute(element: Element): boolean {
  return element.hasAttribute('data-component');
}

// Error types
export class ComponentError extends Error {
  constructor(
    message: string,
    public readonly componentName?: string,
    public readonly element?: HTMLElement
  ) {
    super(message);
    this.name = 'ComponentError';
  }
}

export class ComponentInitializationError extends ComponentError {
  constructor(
    message: string,
    componentName: string,
    element?: HTMLElement,
    public readonly cause?: Error
  ) {
    super(
      `Failed to initialize component '${componentName}': ${message}`,
      componentName,
      element
    );
    this.name = 'ComponentInitializationError';
  }
}

export class ComponentNotFoundError extends ComponentError {
  constructor(componentName: string, element?: HTMLElement) {
    super(
      `Component '${componentName}' not found in factory registry`,
      componentName,
      element
    );
    this.name = 'ComponentNotFoundError';
  }
}

// Re-export commonly used types
export type {
  ComponentWithUpdate as Component,
  ComponentFactory as Factory,
  ComponentSystemAPI as System,
};
