import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import FormField from '@/components/ask/FormField';
import { colors } from '@/constants/colors';

describe('FormField', () => {
  it('renders the label and input, and forwards text changes', () => {
    const onChangeText = jest.fn();
    render(
      <FormField
        label="Title"
        value=""
        onChangeText={onChangeText}
        placeholder="Short summary"
        testID="title-field"
      />,
    );
    expect(screen.getByText('Title')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('title-field'), 'Hello');
    expect(onChangeText).toHaveBeenCalledWith('Hello');
  });

  it('shows a live character counter when maxLength is set', () => {
    render(
      <FormField
        label="Details"
        value="abc"
        onChangeText={jest.fn()}
        maxLength={2000}
        multiline
      />,
    );
    expect(screen.getByText('3 / 2000')).toBeTruthy();
  });

  it('hides the counter when maxLength is not set', () => {
    render(<FormField label="Price" value="5" onChangeText={jest.fn()} />);
    expect(screen.queryByText(/\/ /)).toBeNull();
  });

  it('shows the error message and a red border when error is set', () => {
    render(
      <FormField
        label="Price ($)"
        value="10001"
        onChangeText={jest.fn()}
        error="Price cannot exceed $10,000.00"
        testID="price-field"
      />,
    );
    expect(screen.getByText('Price cannot exceed $10,000.00')).toBeTruthy();
    const input = screen.getByTestId('price-field');
    const flat = Array.isArray(input.props.style)
      ? Object.assign({}, ...input.props.style.flat())
      : input.props.style;
    expect(flat.borderColor).toBe(colors.RED);
  });

  it('uses the default border when there is no error', () => {
    render(
      <FormField label="Price ($)" value="5" onChangeText={jest.fn()} testID="ok-field" />,
    );
    const input = screen.getByTestId('ok-field');
    const flat = Array.isArray(input.props.style)
      ? Object.assign({}, ...input.props.style.flat())
      : input.props.style;
    expect(flat.borderColor).not.toBe(colors.RED);
  });

  it('forwards keyboard type and multiline to the input', () => {
    render(
      <FormField
        label="Price ($)"
        value=""
        onChangeText={jest.fn()}
        keyboardType="decimal-pad"
        multiline
        testID="props-field"
      />,
    );
    const input = screen.getByTestId('props-field');
    expect(input.props.keyboardType).toBe('decimal-pad');
    expect(input.props.multiline).toBe(true);
  });
});
