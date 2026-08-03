import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import AskScreen from '@/app/ask/index';
import { createQuestion } from '@/services/questions.services';
import useAppStore from '@/store/app.store';
import * as Location from 'expo-location';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/services/questions.services', () => ({
  createQuestion: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));

jest.mock('@/components/shared/KeyboardAwareScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('@/components/ask/QuestionPublishedSheet', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible }: { visible: boolean }) =>
      visible ? React.createElement(View, { testID: 'published-sheet' }, React.createElement(Text, null, 'published')) : null,
  };
});

const mockCreateQuestion = createQuestion as jest.Mock;
const mockRequestPermission = Location.requestForegroundPermissionsAsync as jest.Mock;
const mockGetPosition = Location.getCurrentPositionAsync as jest.Mock;
const mockReverseGeocode = Location.reverseGeocodeAsync as jest.Mock;

const fillValidForm = () => {
  fireEvent.changeText(screen.getByTestId('title-input'), 'Where is the best shawarma?');
  fireEvent.changeText(screen.getByTestId('price-input'), '10');
  fireEvent.changeText(
    screen.getByTestId('detail-input'),
    'Looking for a great shawarma spot downtown.',
  );
  fireEvent.changeText(
    screen.getByTestId('criteria-input'),
    'Name and rough queue length.',
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  useAppStore.setState({ loading: false });
});

describe('AskScreen price input', () => {
  it('strips non-numeric characters and collapses extra decimal points', () => {
    render(<AskScreen />);
    const input = screen.getByTestId('price-input');

    fireEvent.changeText(input, 'abc');
    expect(input.props.value).toBe('');

    fireEvent.changeText(input, '1a2b.5x0');
    expect(input.props.value).toBe('12.50');

    fireEvent.changeText(input, '12.5.75');
    expect(input.props.value).toBe('12.575');

    expect(input.props.keyboardType).toBe('decimal-pad');
  });

  it('shows the limit message and red border above $10,000 and disables publish', () => {
    render(<AskScreen />);
    fillValidForm();
    fireEvent.changeText(screen.getByTestId('price-input'), '10001');

    expect(screen.getByText(/cannot exceed \$10,000/)).toBeTruthy();
    const input = screen.getByTestId('price-input');
    const flat = Object.assign({}, ...input.props.style.flat());
    expect(flat.borderColor).toBe('#FF0000');
    expect(screen.getByText('Publish question')).toBeTruthy();
    // The button stays disabled while the error is visible.
    expect(mockCreateQuestion).not.toHaveBeenCalled();
  });

  it('clears the limit error when the price is back in range', () => {
    render(<AskScreen />);
    const input = screen.getByTestId('price-input');
    fireEvent.changeText(input, '10001');
    expect(screen.getByText(/cannot exceed/)).toBeTruthy();
    fireEvent.changeText(input, '9999');
    expect(screen.queryByText(/cannot exceed/)).toBeNull();
  });
});

describe('AskScreen character counters', () => {
  it('shows live counters for the limited fields', () => {
    render(<AskScreen />);
    expect(screen.getByText('0 / 120')).toBeTruthy();
    expect(screen.getByText('0 / 2000')).toBeTruthy();
    expect(screen.getByText('0 / 1000')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('title-input'), 'hello');
    expect(screen.getByText('5 / 120')).toBeTruthy();
  });
});

describe('AskScreen publish', () => {
  it('publishes a trimmed payload and shows the success sheet', async () => {
    mockCreateQuestion.mockResolvedValue({ id: 'q1' });
    render(<AskScreen />);
    fillValidForm();

    fireEvent.press(screen.getByText('Publish question'));

    await waitFor(() =>
      expect(mockCreateQuestion).toHaveBeenCalledWith({
        title: 'Where is the best shawarma?',
        detail: 'Looking for a great shawarma spot downtown.',
        price: 10,
        acceptanceCriteria: 'Name and rough queue length.',
      }),
    );
    expect(await screen.findByTestId('published-sheet')).toBeTruthy();
  });

  it('shows the server error inline when publishing fails', async () => {
    mockCreateQuestion.mockRejectedValue({
      response: { data: { error: 'price must be less than or equal to 10000' } },
    });
    render(<AskScreen />);
    fillValidForm();

    fireEvent.press(screen.getByText('Publish question'));
    expect(
      await screen.findByText('price must be less than or equal to 10000'),
    ).toBeTruthy();
  });

  it('shows a generic inline error for unexpected failures', async () => {
    mockCreateQuestion.mockRejectedValue(new Error('network down'));
    render(<AskScreen />);
    fillValidForm();

    fireEvent.press(screen.getByText('Publish question'));
    expect(await screen.findByText(/failed to publish/i)).toBeTruthy();
  });

  it('keeps publish disabled until every field is valid', () => {
    render(<AskScreen />);
    fireEvent.press(screen.getByText('Publish question'));
    expect(mockCreateQuestion).not.toHaveBeenCalled();

    fillValidForm();
    fireEvent.changeText(screen.getByTestId('price-input'), '0');
    fireEvent.press(screen.getByText('Publish question'));
    expect(mockCreateQuestion).not.toHaveBeenCalled();
  });
});

describe('AskScreen location', () => {
  it('adds location and includes it in the payload', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({ coords: { latitude: 44.6, longitude: -63.6 } });
    mockReverseGeocode.mockResolvedValue([
      { name: '123', street: 'Main St', city: 'Halifax', region: 'NS' },
    ]);
    mockCreateQuestion.mockResolvedValue({ id: 'q2' });
    render(<AskScreen />);

    fireEvent.press(screen.getByText('Add location (optional)'));
    expect(await screen.findByText(/123, Main St, Halifax, NS/)).toBeTruthy();

    fillValidForm();
    fireEvent.press(screen.getByText('Publish question'));
    await waitFor(() =>
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 44.6,
          longitude: -63.6,
          address: '123, Main St, Halifax, NS',
          restrictToNearby: true,
        }),
      ),
    );
  });

  it('handles missing reverse-geocode results with a null address', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({ coords: { latitude: 44.6, longitude: -63.6 } });
    mockReverseGeocode.mockResolvedValue([]);
    mockCreateQuestion.mockResolvedValue({ id: 'q3' });
    render(<AskScreen />);

    fireEvent.press(screen.getByText('Add location (optional)'));
    await waitFor(() =>
      expect(screen.getByText('Location added')).toBeTruthy(),
    );

    fillValidForm();
    fireEvent.press(screen.getByText('Publish question'));
    await waitFor(() =>
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ address: null }),
      ),
    );
  });

  it('alerts and does not add a location when permission is denied', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'denied' });
    render(<AskScreen />);

    fireEvent.press(screen.getByText('Add location (optional)'));
    await waitFor(() =>
      expect(mockRequestPermission).toHaveBeenCalled(),
    );
    expect(screen.getByText('Add location (optional)')).toBeTruthy();
    expect(mockGetPosition).not.toHaveBeenCalled();
  });

  it('removes the location when toggled off', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({ coords: { latitude: 44.6, longitude: -63.6 } });
    mockReverseGeocode.mockResolvedValue([{ city: 'Halifax' }]);
    render(<AskScreen />);

    fireEvent.press(screen.getByText('Add location (optional)'));
    expect(await screen.findByText('Location added')).toBeTruthy();

    fireEvent.press(screen.getByText('Location added'));
    expect(screen.getByText('Add location (optional)')).toBeTruthy();
  });

  it('toggles the nearby-only switch', async () => {
    mockRequestPermission.mockResolvedValue({ status: 'granted' });
    mockGetPosition.mockResolvedValue({ coords: { latitude: 44.6, longitude: -63.6 } });
    mockReverseGeocode.mockResolvedValue([{ city: 'Halifax' }]);
    mockCreateQuestion.mockResolvedValue({ id: 'q4' });
    render(<AskScreen />);

    fireEvent.press(screen.getByText('Add location (optional)'));
    await screen.findByText('Location added');

    const toggle = screen.getByTestId('restrict-nearby-switch');
    expect(toggle.props.value).toBe(true);
    fireEvent(toggle, 'onValueChange', false);
    expect(screen.getByTestId('restrict-nearby-switch').props.value).toBe(false);

    fillValidForm();
    fireEvent.press(screen.getByText('Publish question'));
    await waitFor(() =>
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ restrictToNearby: false }),
      ),
    );
  });
});
