import { hydrateRoot } from "react-dom/client";
import { SiteNavigation } from "../components/site-navigation";

const root = document.getElementById("site-navigation");
if (root) {
  hydrateRoot(
    root,
    <SiteNavigation active={root.dataset.active || "library"} />,
    {
      identifierPrefix: "navigation-",
    },
  );
}
