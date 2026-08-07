type TeamBadgeProps = {
  name: string;
  logoUrl?: string | null;
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/**
 * Preparo para escudo de clube / bandeira de selecao no futuro: sem servico de
 * imagem integrado ainda, so aceita um `logoUrl` opcional e cai para iniciais.
 */
export function TeamBadge({ name, logoUrl }: TeamBadgeProps) {
  if (logoUrl) {
    return (
      <img
        alt={name}
        className="h-8 w-8 rounded-full object-cover"
        src={logoUrl}
      />
    );
  }

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
      {getInitials(name)}
    </span>
  );
}
