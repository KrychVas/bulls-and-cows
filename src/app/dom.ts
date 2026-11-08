export type Child = Node | string | null | undefined | false;

export interface ElementOptions {
  readonly id?: string;
  readonly className?: string;
  readonly text?: string;
  readonly attrs?: Readonly<Record<string, string | number | boolean | undefined>>;
  readonly dataset?: Readonly<Record<string, string>>;
}

export const el = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  options: ElementOptions = {},
  children: readonly Child[] = [],
): HTMLElementTagNameMap[Tag] => {
  const node = document.createElement(tag);

  if (options.id !== undefined) {
    node.id = options.id;
  }

  if (options.className !== undefined) {
    node.className = options.className;
  }

  if (options.text !== undefined) {
    node.textContent = options.text;
  }

  Object.entries(options.attrs ?? {}).forEach(([name, value]) => {
    if (value === undefined || value === false) {
      return;
    }

    node.setAttribute(name, value === true ? '' : String(value));
  });

  Object.entries(options.dataset ?? {}).forEach(([name, value]) => {
    node.dataset[name] = value;
  });

  children.forEach((child) => {
    if (child === null || child === undefined || child === false) {
      return;
    }

    node.append(child);
  });

  return node;
};

export interface ButtonOptions extends ElementOptions {
  readonly onClick?: (event: MouseEvent) => void;
}

export const button = (label: string, options: ButtonOptions = {}): HTMLButtonElement => {
  const { onClick, ...elementOptions } = options;
  const node = el(
    'button',
    {
      ...elementOptions,
      attrs: {
        type: 'button',
        ...(elementOptions.attrs ?? {}),
      },
    },
    [label],
  );

  if (onClick !== undefined) {
    node.addEventListener('click', onClick);
  }

  return node;
};
