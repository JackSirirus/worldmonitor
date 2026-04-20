## 1. Create ReportModal Component

- [x] 1.1 Create `src/components/layout/ReportModal.ts` file
- [x] 1.2 Implement `show(report: Report)` method to display modal
- [x] 1.3 Implement `hide()` method to close modal
- [x] 1.4 Create overlay and modal DOM elements
- [x] 1.5 Add ESC key event listener for closing
- [x] 1.6 Add backdrop click handler for closing
- [x] 1.7 Disable body scroll when modal is open

## 2. Style the Modal

- [x] 2.1 Add modal overlay styles (fixed position, semi-transparent background)
- [x] 2.2 Add modal container styles (centered, max-width 800px, max-height 80vh)
- [x] 2.3 Add modal header styles with close button
- [x] 2.4 Add modal body styles with scroll support

## 3. Modify ReportPanel to Use Modal

- [x] 3.1 Import ReportModal in ReportPanel
- [x] 3.2 Remove inline `renderCurrentReport()` method
- [x] 3.3 Modify report item click handler to call `ReportModal.show()`
- [x] 3.4 Remove close button event handler (modal has its own)
- [x] 3.5 Clean up CSS styles for inline report detail (can be removed)

## 4. Testing

- [ ] 4.1 Test opening modal by clicking a report item
- [ ] 4.2 Test closing modal via close button
- [ ] 4.3 Test closing modal via ESC key
- [ ] 4.4 Test closing modal via backdrop click
- [ ] 4.5 Verify report content renders correctly
- [ ] 4.6 Test responsive layout on smaller screens
