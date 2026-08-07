import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Platform } from 'react-native';
import FormField from '@/components/shared/FormField';
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

  it('keeps copy and paste enabled on the native input', () => {
    render(<FormField label="Title" value="" onChangeText={jest.fn()} testID="clipboard-field" />);
    const input = screen.getByTestId('clipboard-field');
    expect(input.props.contextMenuHidden).toBe(false);
    expect(input.props.editable).toBe(true);
    expect(input.props.selectionColor).toBe(colors.PRIMARY);
  });

  it('places the error and counter on the same footer row', () => {
    render(
      <FormField
        label="Details"
        value="abc"
        onChangeText={jest.fn()}
        maxLength={2000}
        error="Add details about what you need."
        multiline
      />,
    );
    expect(screen.getByText('Add details about what you need.')).toBeTruthy();
    expect(screen.getByText('3 / 2000')).toBeTruthy();
  });

  it('aligns the label with the input left edge', () => {
    render(<FormField label="Title" value="" onChangeText={jest.fn()} />);
    const label = screen.getByText('Title');
    const flat = Array.isArray(label.props.style)
      ? Object.assign({}, ...label.props.style.flat())
      : label.props.style;
    expect(flat.paddingLeft).toBeUndefined();
  });

  it('forwards keyboard type, input mode, and multiline to the input', () => {
    render(
      <FormField
        label="Price ($)"
        value=""
        onChangeText={jest.fn()}
        keyboardType="decimal-pad"
        inputMode="decimal"
        multiline
        testID="props-field"
      />,
    );
    const input = screen.getByTestId('props-field');
    expect(input.props.keyboardType).toBe('decimal-pad');
    expect(input.props.inputMode).toBe('decimal');
    expect(input.props.multiline).toBe(true);
  });

  it('applies the web text-selection style on web', () => {
    const originalOS = Object.getOwnPropertyDescriptor(Platform, 'OS');
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    try {
      render(<FormField label="Title" value="" onChangeText={jest.fn()} testID="web-field" />);
      const input = screen.getByTestId('web-field');
      const flat = Object.assign({}, ...input.props.style.flat());
      expect(flat.userSelect).toBe('text');
    } finally {
      if (originalOS) Object.defineProperty(Platform, 'OS', originalOS);
    }
  });
});
