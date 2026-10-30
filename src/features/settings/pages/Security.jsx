import PageHeader from "../../../components/layout/PageHeader";
import ChangePasswordForm from "../components/ChangePasswordForm";

export default function Security() {
  return (
    <div className="stack">
      <PageHeader
        title="Security"
        description="Change your password. Every other device is signed out when you do."
        breadcrumbs={[{ label: "Settings" }, { label: "Security" }]}
      />

      <ChangePasswordForm />
    </div>
  );
}
