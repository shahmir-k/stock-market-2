// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HistoricalDateSlider } from '@/components/trading/HistoricalDateSlider';

const TODAY = '2026-05-22';

describe('HistoricalDateSlider', () => {
  it('renders skeleton when earliestDate is null and loading', () => {
    render(
      <HistoricalDateSlider
        symbol="AAPL"
        value={TODAY}
        earliestDate={null}
        latestDate={TODAY}
        onChange={() => {}}
        loading
      />,
    );
    expect(screen.getByText(/loading available range/i)).toBeTruthy();
  });

  it('exposes aria-valuemin/max/now and aria-valuetext on the slider', () => {
    render(
      <HistoricalDateSlider
        symbol="AAPL"
        value="2020-01-02"
        earliestDate="2016-01-04"
        latestDate={TODAY}
        onChange={() => {}}
      />,
    );
    const range = screen.getByLabelText(/time-travel slider for aapl/i);
    expect(range.getAttribute('aria-valuetext')).toMatch(/January 2, 2020/);
    const minStr = range.getAttribute('aria-valuemin');
    const maxStr = range.getAttribute('aria-valuemax');
    expect(Number(minStr)).toBeLessThan(Number(maxStr));
  });

  it('"Today" button calls onChange with latestDate', () => {
    const onChange = vi.fn();
    const { container } = render(
      <HistoricalDateSlider
        symbol="AAPL"
        value="2020-01-02"
        earliestDate="2016-01-04"
        latestDate={TODAY}
        onChange={onChange}
      />,
    );
    const button = container.querySelector('button');
    expect(button).not.toBeNull();
    fireEvent.click(button!);
    expect(onChange).toHaveBeenCalledWith(TODAY);
  });

  it('renders the minDateReason copy when provided', () => {
    render(
      <HistoricalDateSlider
        symbol="AAPL"
        value="2020-01-02"
        earliestDate="2016-01-04"
        latestDate={TODAY}
        minDate="2019-06-01"
        minDateReason="You didn't own AAPL before 2019-06-01."
        onChange={() => {}}
      />,
    );
    expect(
      screen.getByText(/you didn't own aapl before 2019-06-01/i),
    ).toBeTruthy();
  });

  it('clamps a value below minDate', () => {
    const onChange = vi.fn();
    const { container } = render(
      <HistoricalDateSlider
        symbol="AAPL"
        value="2020-01-02"
        earliestDate="2016-01-04"
        latestDate={TODAY}
        minDate="2019-06-01"
        onChange={onChange}
      />,
    );
    const range = container.querySelector('input[type="range"]');
    expect(range).not.toBeNull();
    // Push the slider below minDate via Home key — should snap to min.
    fireEvent.keyDown(range!, { key: 'Home' });
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(last >= '2019-06-01').toBe(true);
  });
});
