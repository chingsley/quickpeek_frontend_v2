import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';
import LocationPickerModal, { LocationPick } from '@/components/ask/LocationPickerModal';
import { getAddressLabel, getLocationSuggestions } from '@/services/location.services';
import * as Location from 'expo-location';

jest.mock('@/services/location.services', () => ({
  getLocationSuggestions: jest.fn(),
  getAddressLabel: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('@/components/ask/LocationPickerMap', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = (props: Record<string, unknown>) =>
    React.createElement(View, { testID: 'picker-map', ...props });
  return { __esModule: true, default: MockMapView };
});

const mockGetSuggestions = getLocationSuggestions as jest.Mock;
const mockGetAddressLabel = getAddressLabel as jest.Mock;
const mockRequestPermission = Location.requestForegroundPermissionsAsync as jest.Mock;
const mockGetPosition = Location.getCurrentPositionAsync as jest.Mock;

const renderPicker = (props: Partial<React.ComponentProps<typeof LocationPickerModal>> = {}) =>
  render(
    <LocationPickerModal visible onClose={jest.fn()} onApply={jest.fn()} {...props} />,
  );

const typeAndSettle = async (text: string) => {
  fireEvent.changeText(screen.getByTestId('location-search-input'), text);
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
};

const dragMapTo = async (coords: { latitude: number; longitude: number }) => {
  const map = screen.getByTestId('picker-map');
  await act(async () => {
    map.props.onPanDrag?.();
    map.props.onRegionChangeComplete({
      ...coords,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  });
};

const settleMapOnly = async (coords: { latitude: number; longitude: number }) => {
  const map = screen.getByTestId('picker-map');
  await act(async () => {
    map.props.onRegionChangeComplete({
      ...coords,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockGetSuggestions.mockResolvedValue([
    { label: 'Halifax, Nova Scotia, Canada', latitude: 44.65, longitude: -63.57 },
    { label: 'Downtown Halifax, Canada', latitude: 44.64, longitude: -63.58 },
  ]);
  mockGetAddressLabel.mockResolvedValue('123, Main St, Halifax, NS');
});

afterEach(() => {
  jest.useRealTimers();
});

describe('LocationPickerModal search', () => {
  it('shows debounced suggestions after typing 3+ characters', async () => {
    renderPicker();
    await typeAndSettle('halifa');

    expect(mockGetSuggestions).toHaveBeenCalledTimes(1);
    expect(mockGetSuggestions).toHaveBeenCalledWith('halifa');
    expect(screen.getByText('Halifax, Nova Scotia, Canada')).toBeTruthy();
    expect(screen.getByText('Downtown Halifax, Canada')).toBeTruthy();
  });

  it('does not search below 3 characters', async () => {
    renderPicker();
    await typeAndSettle('ha');
    expect(mockGetSuggestions).not.toHaveBeenCalled();
  });

  it('ignores stale responses — only the latest query renders', async () => {
    let resolveFirst!: (value: unknown) => void;
    mockGetSuggestions
      .mockImplementationOnce(
        () => new Promise((resolve) => (resolveFirst = resolve)),
      )
      .mockResolvedValueOnce([
        { label: 'Hamilton, Ontario, Canada', latitude: 43.25, longitude: -79.87 },
      ]);

    renderPicker();
    fireEvent.changeText(screen.getByTestId('location-search-input'), 'hal');
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    fireEvent.changeText(screen.getByTestId('location-search-input'), 'ham');
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    // The first (stale) request resolves AFTER the latest one.
    await act(async () => {
      resolveFirst([{ label: 'Stale Place', latitude: 1, longitude: 1 }]);
    });

    expect(screen.getByText('Hamilton, Ontario, Canada')).toBeTruthy();
    expect(screen.queryByText('Stale Place')).toBeNull();
  });

  it('shows a friendly message when search fails and a not-found state on empty results', async () => {
    renderPicker();
    mockGetSuggestions.mockRejectedValueOnce(new Error('503'));
    await typeAndSettle('zzz');
    expect(screen.getByText(/could not search places/i)).toBeTruthy();

    mockGetSuggestions.mockResolvedValueOnce([]);
    fireEvent.changeText(screen.getByTestId('location-search-input'), 'qqqq');
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(screen.getByText(/no places found/i)).toBeTruthy();
  });

  it('clears the query and suggestions with the clear button', async () => {
    renderPicker();
    await typeAndSettle('halifa');
    expect(screen.getByText('Halifax, Nova Scotia, Canada')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Clear search'));
    expect(screen.getByTestId('location-search-input').props.value).toBe('');
    expect(screen.queryByText('Halifax, Nova Scotia, Canada')).toBeNull();
  });
});

describe('LocationPickerModal selection and apply', () => {
  it('applies the tapped suggestion', async () => {
    const onApply = jest.fn();
    renderPicker({ onApply });
    await typeAndSettle('halifa');

    fireEvent.press(screen.getByText('Halifax, Nova Scotia, Canada'));
    expect(screen.queryByText('Downtown Halifax, Canada')).toBeNull();

    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith({
      latitude: 44.65,
      longitude: -63.57,
      address: 'Halifax, Nova Scotia, Canada',
    } as LocationPick);
  });

  it('does not re-search after a suggestion fills the input', async () => {
    renderPicker();
    await typeAndSettle('halifa');
    fireEvent.press(screen.getByText('Halifax, Nova Scotia, Canada'));

    await act(async () => {
      jest.advanceTimersByTime(1200);
    });
    expect(mockGetSuggestions).toHaveBeenCalledTimes(1);
  });

  it('updates the address as the map is dragged and applies it', async () => {
    const onApply = jest.fn();
    renderPicker({ onApply });

    await dragMapTo({ latitude: 45.0, longitude: -64.0 });

    expect(mockGetAddressLabel).toHaveBeenCalledWith(45.0, -64.0);
    expect(await screen.findByText('123, Main St, Halifax, NS')).toBeTruthy();

    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith({
      latitude: 45.0,
      longitude: -64.0,
      address: '123, Main St, Halifax, NS',
    });
  });

  it('uses the current location when the GPS button is pressed', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({ coords: { latitude: 44.61, longitude: -63.61 } });
    const onApply = jest.fn();
    renderPicker({ onApply });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Use current location'));
    });

    expect(mockGetPosition).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 44.61, longitude: -63.61 }),
    );
  });

  it('shows a hint when GPS permission is denied', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });
    renderPicker();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Use current location'));
    });
    expect(screen.getByText(/location permission is needed/i)).toBeTruthy();
    expect(mockGetPosition).not.toHaveBeenCalled();
  });

  it('starts from the initial pick when provided', async () => {
    const onApply = jest.fn();
    renderPicker({
      onApply,
      initial: { latitude: 44.7, longitude: -63.7, address: 'Saved address' },
    });
    expect(screen.getByTestId('location-search-input').props.value).toBe('Saved address');

    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledWith({
      latitude: 44.7,
      longitude: -63.7,
      address: 'Saved address',
    });
  });

  it('closes without applying', () => {
    const onClose = jest.fn();
    const onApply = jest.fn();
    renderPicker({ onClose, onApply });
    fireEvent.press(screen.getByLabelText('Close location picker'));
    expect(onClose).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('shows an apply hint when Apply is tapped before a location is chosen', async () => {
    const onApply = jest.fn();
    renderPicker({ onApply });

    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText(/enter an address or drag the map to choose a location/i)).toBeTruthy();

    mockGetAddressLabel.mockResolvedValue('Halifax Harbour, Halifax, NS');
    await settleMapOnly({ latitude: 44.65, longitude: -63.57 });

    expect(screen.getByText(/enter an address or drag the map to choose a location/i)).toBeTruthy();
    expect(screen.queryByText('Halifax Harbour, Halifax, NS')).toBeNull();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('keeps Apply inactive until a location is actually chosen', async () => {
    const onApply = jest.fn();
    renderPicker({ onApply });

    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).not.toHaveBeenCalled();

    await typeAndSettle('halifa');
    fireEvent.press(screen.getByText('Halifax, Nova Scotia, Canada'));
    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('enables Apply after a map drag', async () => {
    const onApply = jest.fn();
    renderPicker({ onApply });

    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).not.toHaveBeenCalled();

    await dragMapTo({ latitude: 45.0, longitude: -64.0 });
    fireEvent.press(screen.getByText('Apply'));
    expect(onApply).toHaveBeenCalledTimes(1);
  });
});


it('ignores a stale search failure after a newer query succeeds', async () => {
  let rejectFirst!: (reason: Error) => void;
  mockGetSuggestions
    .mockImplementationOnce(
      () => new Promise((_, reject) => (rejectFirst = reject)),
    )
    .mockResolvedValueOnce([
      { label: 'Hamilton, Ontario, Canada', latitude: 43.25, longitude: -79.87 },
    ]);

  renderPicker();
  fireEvent.changeText(screen.getByTestId('location-search-input'), 'zzz');
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
  fireEvent.changeText(screen.getByTestId('location-search-input'), 'ham');
  await act(async () => {
    jest.advanceTimersByTime(600);
  });
  await act(async () => {
    rejectFirst(new Error('503'));
  });

  expect(screen.getByText('Hamilton, Ontario, Canada')).toBeTruthy();
  expect(screen.queryByText(/could not search places/i)).toBeNull();
});

it('ignores a stale reverse-geocode after a newer drag', async () => {
  let resolveFirst!: (value: string) => void;
  mockGetAddressLabel
    .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
    .mockResolvedValueOnce('Newest address');

  renderPicker();
  await dragMapTo({ latitude: 45.0, longitude: -64.0 });
  await dragMapTo({ latitude: 46.0, longitude: -65.0 });
  await act(async () => {
    resolveFirst('Stale address');
  });

  expect(await screen.findByText('Newest address')).toBeTruthy();
  expect(screen.queryByText('Stale address')).toBeNull();
});

it('falls back to coordinates when applying before the geocode resolves', async () => {
  mockGetAddressLabel.mockImplementation(() => new Promise(() => {}));
  const onApply = jest.fn();
  renderPicker({ onApply });

  await dragMapTo({ latitude: 45.0, longitude: -64.0 });
  fireEvent.press(screen.getByText('Apply'));
  expect(onApply).toHaveBeenCalledWith({
    latitude: 45.0,
    longitude: -64.0,
    address: '45.00000, -64.00000',
  });
});

describe('LocationPickerModal map hint', () => {
  it('shows the pick instructions as a label above the search input', () => {
    renderPicker();
    expect(screen.getByText(/drag the map to move the pin/i)).toBeTruthy();
  });
});

describe('LocationPickerModal web fallback', () => {
  it('shows a themed placeholder instead of the map on web', () => {
    const originalOS = Object.getOwnPropertyDescriptor(Platform, 'OS');
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    try {
      renderPicker();
      expect(screen.queryByTestId('picker-map')).toBeNull();
      expect(screen.getByText(/map preview is available in the mobile app/i)).toBeTruthy();
    } finally {
      if (originalOS) Object.defineProperty(Platform, 'OS', originalOS);
    }
  });
});

describe('LocationPickerModal safe-area handling', () => {
  it('pads the container by the context insets so controls clear the notch and home indicator', () => {
    const safeArea = require('react-native-safe-area-context');
    const spy = jest
      .spyOn(safeArea, 'useSafeAreaInsets')
      .mockReturnValue({ top: 47, bottom: 34, left: 0, right: 0 });
    try {
      renderPicker();
      // Walk up from the header title to the padded container.
      let node: ReturnType<typeof screen.getByText> | null = screen.getByText('Location');
      let flat: Record<string, unknown> = {};
      while (node) {
        const style = node.props?.style;
        const merged = Array.isArray(style)
          ? Object.assign({}, ...style.flat())
          : (style ?? {});
        if (merged.paddingTop !== undefined) {
          flat = merged;
          break;
        }
        node = node.parent;
      }
      expect(flat.paddingTop).toBe(47);
      expect(flat.paddingBottom).toBe(34);
    } finally {
      spy.mockRestore();
    }
  });
});
