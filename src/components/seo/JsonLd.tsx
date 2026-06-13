interface JsonLdProps {
  data: object | object[];
  id?: string;
}

export function JsonLd({ data, id }: JsonLdProps) {
  const json = JSON.stringify(data);
  return (
    <script
      id={id}
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
