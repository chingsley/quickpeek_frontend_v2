import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import AskScreen from '@/app/ask/index';
import { createQuestion } from '@/services/questions.services';
import { PRICE_KEYBOARD_TYPE } from '@/constants/textInput';
import useAppStore from '@/store/app.store';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn(), push: jest.fn() }),
}));

jest.mock('@/services/questions.services', () => ({
  createQuestion: jest.fn(),
}));

jest.mock('@/components/ask/LocationPickerModal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: Record<string, unknown> & { visible: boolean; }) =>
      props.visible ? React.createElement(View, { testID: 'location-picker', ...props }) : null,
  };
});

jest.mock('@/components/shared/KeyboardAwareScreen', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode; }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('@/components/ask/QuestionPublishedSheet', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    __esModule: true,
    default: ({ visible }: { visible: boolean; }) =>
      visible ? React.createElement(View, { testID: 'published-sheet' }, React.createElement(Text, null, 'published')) : null,
  };
});

const mockCreateQuestion = createQuestion as jest.Mock;

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

    expect(input.props.keyboardType).toBe(PRICE_KEYBOARD_TYPE);
  });

  it('shows the limit message and red border above $10,000 when publish is tapped', () => {
    render(<AskScreen />);
    fillValidForm();
    fireEvent.changeText(screen.getByTestId('price-input'), '10001');

    expect(screen.getByText(/cannot exceed \$10,000/)).toBeTruthy();
    const input = screen.getByTestId('price-input');
    const flat = Object.assign({}, ...input.props.style.flat());
    expect(flat.borderColor).toBe('#FF0000');
    fireEvent.press(screen.getByText('Publish question'));
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

  it('shows field errors when publish is tapped with an invalid form', () => {
    render(<AskScreen />);
    fireEvent.press(screen.getByText('Publish question'));
    expect(screen.getByText('Enter a title.')).toBeTruthy();
    expect(screen.getByText('Enter a price.')).toBeTruthy();
    expect(screen.getByText('Add details about what you need.')).toBeTruthy();
    expect(screen.getByText('Describe what counts as a good answer.')).toBeTruthy();
    expect(mockCreateQuestion).not.toHaveBeenCalled();

    fillValidForm();
    fireEvent.changeText(screen.getByTestId('price-input'), '0');
    fireEvent.press(screen.getByText('Publish question'));
    expect(screen.getByText('Enter a price greater than $0.')).toBeTruthy();
    expect(mockCreateQuestion).not.toHaveBeenCalled();
  });
});

describe('AskScreen location', () => {
  const applyPick = (pick: {
    latitude: number;
    longitude: number;
    address: string;
    scope?: 'AT_EXACT_ADDRESS' | 'WALKING' | 'NEIGHBOURHOOD' | 'CITY' | 'ANYWHERE';
  }) => {
    act(() => {
      screen.getByTestId('location-picker').props.onApply(pick);
    });
  };

  it('opens the picker from the location field and applies a pick', async () => {
    mockCreateQuestion.mockResolvedValue({ id: 'q2' });
    render(<AskScreen />);

    expect(screen.getByText('Search for a location')).toBeTruthy();
    expect(screen.queryByTestId('location-picker')).toBeNull();

    fireEvent.press(screen.getByLabelText('Choose location'));
    expect(screen.getByTestId('location-picker')).toBeTruthy();

    applyPick({ latitude: 44.6, longitude: -63.6, address: '123, Main St, Halifax, NS', scope: 'AT_EXACT_ADDRESS' });
    expect(screen.queryByTestId('location-picker')).toBeNull();
    expect(screen.getByText('123, Main St, Halifax, NS')).toBeTruthy();

    fillValidForm();
    fireEvent.press(screen.getByText('Publish question'));
    await waitFor(() =>
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 44.6,
          longitude: -63.6,
          address: '123, Main St, Halifax, NS',
          locationScope: 'AT_EXACT_ADDRESS',
        }),
      ),
    );
  });

  it('publishes without location fields when none was picked', async () => {
    mockCreateQuestion.mockResolvedValue({ id: 'q3' });
    render(<AskScreen />);

    fillValidForm();
    fireEvent.press(screen.getByText('Publish question'));
    await waitFor(() => expect(mockCreateQuestion).toHaveBeenCalled());
    const payload = mockCreateQuestion.mock.calls[0][0];
    expect(payload).not.toHaveProperty('latitude');
    expect(payload).not.toHaveProperty('longitude');
    expect(payload).not.toHaveProperty('address');
  });

  it('removes a picked location with the clear button', async () => {
    render(<AskScreen />);

    fireEvent.press(screen.getByLabelText('Choose location'));
    applyPick({ latitude: 44.6, longitude: -63.6, address: 'Halifax, NS', scope: 'AT_EXACT_ADDRESS' });
    expect(screen.getByText('Halifax, NS')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Remove location'));
    expect(screen.getByText('Search for a location')).toBeTruthy();
    expect(screen.queryByText('Halifax, NS')).toBeNull();
  });

  it('closes the picker without applying', () => {
    render(<AskScreen />);

    fireEvent.press(screen.getByLabelText('Choose location'));
    act(() => {
      screen.getByTestId('location-picker').props.onClose();
    });
    expect(screen.queryByTestId('location-picker')).toBeNull();
    expect(screen.getByText('Search for a location')).toBeTruthy();
  });

  it('reopens the picker with the current pick as initial', () => {
    render(<AskScreen />);

    fireEvent.press(screen.getByLabelText('Choose location'));
    applyPick({ latitude: 44.6, longitude: -63.6, address: 'Halifax, NS', scope: 'AT_EXACT_ADDRESS' });

    fireEvent.press(screen.getByLabelText('Choose location'));
    expect(screen.getByTestId('location-picker').props.initial).toEqual({
      latitude: 44.6,
      longitude: -63.6,
      address: 'Halifax, NS',
      scope: 'AT_EXACT_ADDRESS',
    });
  });

  it('ignores an empty pick — no location set, toggle stays hidden', () => {
    render(<AskScreen />);

    fireEvent.press(screen.getByLabelText('Choose location'));
    applyPick({ latitude: 44.65, longitude: -63.57, address: '', scope: 'AT_EXACT_ADDRESS' });

    expect(screen.queryByTestId('location-picker')).toBeNull();
    expect(screen.getByText('Search for a location')).toBeTruthy();
    expect(screen.queryByText('Who can answer this?')).toBeNull();
  });

  it('pre-selects the detected scope and lets the user override it', async () => {
    mockCreateQuestion.mockResolvedValue({ id: 'q4' });
    render(<AskScreen />);

    fireEvent.press(screen.getByLabelText('Choose location'));
    applyPick({ latitude: 44.6, longitude: -63.6, address: 'Halifax, NS', scope: 'AT_EXACT_ADDRESS' });

    // Chips appear with the detected scope pre-selected and concrete copy.
    expect(screen.getByText('Who can answer this?')).toBeTruthy();
    expect(screen.getByText(/within 300 m/)).toBeTruthy();

    // Override to ANYWHERE — helper and payload follow.
    fireEvent.press(screen.getByText('Any responder can answer, location irrelevant'));
    expect(screen.getByText('Location is shown for context only.')).toBeTruthy();

    fillValidForm();
    fireEvent.press(screen.getByText('Publish question'));
    await waitFor(() =>
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ locationScope: 'ANYWHERE' }),
      ),
    );
  });

  it('uses the detected scope in the payload when not overridden', async () => {
    mockCreateQuestion.mockResolvedValue({ id: 'q6' });
    render(<AskScreen />);

    fireEvent.press(screen.getByLabelText('Choose location'));
    applyPick({ latitude: 44.6, longitude: -63.6, address: 'Halifax, NS', scope: 'CITY' });
    expect(screen.getByText(/within 25 km/)).toBeTruthy();

    fillValidForm();
    fireEvent.press(screen.getByText('Publish question'));
    await waitFor(() =>
      expect(mockCreateQuestion).toHaveBeenCalledWith(
        expect.objectContaining({ locationScope: 'CITY' }),
      ),
    );
  });
});
