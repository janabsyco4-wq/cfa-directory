import LoginClient from "./LoginClient";

export default async function AdminLoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { reason } = await searchParams;
  return <LoginClient reason={typeof reason === "string" ? reason : undefined} />;
}
