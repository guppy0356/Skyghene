import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Welcome",
  render: () => (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to Job-tracker</h1>
      <p className="text-gray-600">
        Replace this with your first feature story.
      </p>
    </div>
  ),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
