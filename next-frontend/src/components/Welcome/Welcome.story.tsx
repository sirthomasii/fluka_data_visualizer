import type { Meta, StoryObj } from '@storybook/react';
import { Welcome } from './Welcome';

const meta: Meta<typeof Welcome> = {
  title: 'Welcome',
  component: Welcome,
};

export default meta;
type Story = StoryObj<typeof Welcome>;

export const Default: Story = {};
