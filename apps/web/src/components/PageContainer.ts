export type PageMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type PagePadding = 'none' | 'sm' | 'md' | 'lg';

export interface PageContainerProps {
  maxWidth?: PageMaxWidth;
  padding?: PagePadding;
  className?: string;
}

/**
 * PageContainer
 * A layout wrapper that constrains width, applies responsive padding,
 * and provides a content element for children to render into.
 */
export class PageContainer {
  private container: HTMLElement;
  private props: PageContainerProps;
  private contentElement: HTMLDivElement | null = null;

  constructor(container: HTMLElement, props: PageContainerProps = {}) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<PageContainerProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  /**
   * Expose the content element for composition by parent code
   */
  getContentElement(): HTMLDivElement | null {
    return this.contentElement;
  }

  private computeWrapperClasses(): string {
    const { maxWidth = 'lg', padding = 'md', className = '' } = this.props;

    const widthMap: Record<PageMaxWidth, string> = {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      full: 'max-w-full',
    };

    const paddingMap: Record<PagePadding, string> = {
      none: 'px-0',
      sm: 'px-4',
      md: 'px-6',
      lg: 'px-8',
    };

    return [
      'mx-auto w-full min-h-screen',
      widthMap[maxWidth],
      paddingMap[padding],
      className,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private render(): void {
    // Clear container
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = this.computeWrapperClasses();

    const content = document.createElement('div');
    content.className = 'w-full';

    wrapper.appendChild(content);
    this.container.appendChild(wrapper);
    this.contentElement = content;
  }
}

export default PageContainer;
