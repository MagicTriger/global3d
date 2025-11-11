# Requirements Document

## Introduction

This feature addresses a visual inconsistency in the Backbag page where tab indicators have different sizes due to varying English text lengths. The "其他" (Other) tab has the English text "OTHER ITEMS" which is longer than "TRIBUTE" and "INCENSE", causing its indicator to appear larger. This creates an unbalanced and unprofessional appearance in the tab navigation.

## Glossary

- **Tab Indicator**: The golden decorative background image ("生成游戏图标 (7).png") that appears behind the active tab text
- **Backbag System**: The inventory/backpack page component that displays player items organized by category tabs
- **Tab Item**: A clickable navigation element consisting of Chinese text, English text, and an optional indicator background

## Requirements

### Requirement 1

**User Story:** As a user viewing the Backbag page, I want all tab indicators to have consistent sizes, so that the interface looks balanced and professional

#### Acceptance Criteria

1. THE Backbag System SHALL render all tab indicators with identical width dimensions regardless of text content length
2. THE Backbag System SHALL render all tab indicators with identical height dimensions regardless of text content length
3. WHEN a tab is selected, THE Backbag System SHALL display the indicator at a fixed size that accommodates the longest text without distortion
4. THE Backbag System SHALL maintain the visual alignment of all tab text elements within their respective indicators

### Requirement 2

**User Story:** As a user on different devices, I want tab indicators to scale appropriately, so that the interface remains consistent across screen sizes

#### Acceptance Criteria

1. WHERE the viewport width is less than or equal to 768 pixels, THE Backbag System SHALL render tab indicators at the mobile-optimized size
2. WHERE the viewport width is less than or equal to 480 pixels, THE Backbag System SHALL render tab indicators at the small-screen-optimized size
3. WHERE the viewport width is greater than or equal to 1200 pixels, THE Backbag System SHALL render tab indicators at the desktop-optimized size
4. THE Backbag System SHALL maintain consistent indicator sizing across all tabs within each responsive breakpoint

### Requirement 3

**User Story:** As a user interacting with tabs, I want the text to remain readable and properly positioned, so that I can easily identify each category

#### Acceptance Criteria

1. THE Backbag System SHALL center-align Chinese text horizontally within the tab indicator
2. THE Backbag System SHALL center-align English text horizontally within the tab indicator
3. THE Backbag System SHALL position text vertically within the visible area of the tab indicator
4. WHEN text length varies between tabs, THE Backbag System SHALL prevent text overflow beyond the indicator boundaries
