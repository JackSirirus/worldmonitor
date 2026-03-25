/**
 * App Layout - Main Layout Container
 * Manages the three-column layout: Left Sidebar | Center | Right Sidebar
 */

import { LeftSidebar } from './LeftSidebar';
import { ChatWindow } from './ChatWindow';
import { ReportPanel } from './ReportPanel';
import { useUIStore } from '@/stores';

export class AppLayout {
  private container: HTMLElement;
  private element: HTMLElement;
  private leftSidebar: LeftSidebar | null = null;
  private chatWindow: ChatWindow | null = null;
  private reportPanel: ReportPanel | null = null;
  private uiStore = useUIStore;

  constructor(container: HTMLElement) {
    this.container = container;
    this.element = this.createElement();
  }

  private createElement(): HTMLElement {
    const el = document.createElement('div');
    el.id = 'app-layout';
    el.className = 'app-layout';
    return el;
  }

  public mount(): void {
    // Set up the layout structure
    this.element.innerHTML = `
      <aside id="left-sidebar-container"></aside>
      <main id="center-content">
        <div id="map-section-container"></div>
        <div id="chat-container"></div>
      </main>
      <aside id="right-sidebar-container"></aside>
    `;

    this.container.appendChild(this.element);

    // Mount components to their containers
    const leftContainer = document.getElementById('left-sidebar-container');
    const centerContent = document.getElementById('center-content');
    const rightContainer = document.getElementById('right-sidebar-container');

    // Wait for DOM to be ready
    setTimeout(() => {
      // Left sidebar (News)
      if (leftContainer) {
        this.leftSidebar = new LeftSidebar(leftContainer);
        this.leftSidebar.mount();
      }

      // Center - Map section (existing)
      const mapContainer = document.getElementById('mapContainer');
      if (mapContainer) {
        const mapSection = document.getElementById('map-section-container');
        if (mapSection) {
          mapSection.appendChild(mapContainer);
        }
      }

      // Center - Chat window
      if (centerContent) {
        this.chatWindow = new ChatWindow(centerContent);
        this.chatWindow.mount();
      }

      // Right sidebar (Reports)
      if (rightContainer) {
        this.reportPanel = new ReportPanel(rightContainer);
        this.reportPanel.mount();
      }
    }, 100);

    // Subscribe to UI store for layout changes
    this.uiStore.subscribe(() => {
      this.handleLayoutChange();
    });
  }

  private handleLayoutChange(): void {
    const state = this.uiStore.getState();

    // Toggle left sidebar
    const leftContainer = document.getElementById('left-sidebar-container');
    if (leftContainer) {
      leftContainer.classList.toggle('hidden', !state.leftSidebarOpen);
    }

    // Toggle right sidebar
    const rightContainer = document.getElementById('right-sidebar-container');
    if (rightContainer) {
      rightContainer.classList.toggle('hidden', !state.rightSidebarOpen);
    }

    // Toggle chat expansion
    const chatWindow = document.getElementById('chat-window');
    if (chatWindow) {
      chatWindow.classList.toggle('expanded', state.chatExpanded);
    }
  }

  public destroy(): void {
    this.leftSidebar?.destroy();
    this.chatWindow?.destroy();
    this.reportPanel?.destroy();
    this.element.remove();
  }

  // Public methods for external control
  public toggleLeftSidebar(): void {
    this.uiStore.getState().toggleLeftSidebar();
  }

  public toggleRightSidebar(): void {
    this.uiStore.getState().toggleRightSidebar();
  }

  public toggleChat(): void {
    this.uiStore.getState().toggleChat();
  }
}

export default AppLayout;
