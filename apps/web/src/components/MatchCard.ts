export interface MatchCardProps {
  playerName: string;
  playerAvatar?: string;
  score: string;
  tournament: string;
  result: 'win' | 'loss';
  className?: string;
  onClick?: () => void;
}

export class MatchCard {
  private container: HTMLElement;
  private props: MatchCardProps;
  private rootElement: HTMLDivElement | null = null;

  constructor(container: HTMLElement, props: MatchCardProps) {
    this.container = container;
    this.props = props;
    this.render();
  }

  update(newProps: Partial<MatchCardProps>): void {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  private getResultColor(result: string): string {
    switch (result) {
      case 'win':
        return 'bg-accent/20 text-accent border-accent/50';
      case 'loss':
        return 'bg-destructive/20 text-destructive border-destructive/50';
      default:
        return 'bg-muted text-foreground';
    }
  }

  private render(): void {
    if (this.rootElement) {
      this.rootElement.remove();
    }

    this.rootElement = document.createElement('div');
    this.rootElement.className = `flex items-center justify-between p-4 rounded-lg bg-gradient-card backdrop-blur-glass border border-border hover:bg-muted/30 transition-all ${this.props.className || ''}`;

    if (this.props.onClick) {
      this.rootElement.style.cursor = 'pointer';
      this.rootElement.addEventListener('click', this.props.onClick);
    }

    // Get initials from playerName
    const initials = this.props.playerName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Left: Avatar + Player Info
    const leftDiv = document.createElement('div');
    leftDiv.className = 'flex items-center gap-3 flex-1';
    leftDiv.innerHTML = `
      <div class="h-10 w-10 border-2 border-border rounded-full flex items-center justify-center text-foreground bg-muted font-semibold">
        ${initials}
      </div>
      <div class="flex-1">
        <p class="font-semibold text-foreground">${this.props.playerName}</p>
        <p class="text-sm text-muted-foreground">${this.props.tournament}</p>
      </div>
    `;

    // Right: Score + Badge
    const rightDiv = document.createElement('div');
    rightDiv.className = 'flex items-center gap-4';

    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'font-bold text-lg text-foreground';
    scoreSpan.textContent = this.props.score;

    const badge = document.createElement('span');
    const badgeClass = this.getResultColor(this.props.result);
    badge.className = `px-2 py-1 text-xs font-semibold rounded border ${badgeClass}`;
    badge.textContent = this.props.result === 'win' ? 'Won' : 'Lost';

    rightDiv.appendChild(scoreSpan);
    rightDiv.appendChild(badge);

    this.rootElement.appendChild(leftDiv);
    this.rootElement.appendChild(rightDiv);
    this.container.appendChild(this.rootElement);
  }

  destroy(): void {
    if (this.rootElement) {
      this.rootElement.remove();
      this.rootElement = null;
    }
  }
}
