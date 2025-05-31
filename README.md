# Kube Helper for VSCode

Kube Helper is a VSCode extension that significantly simplifies Kubernetes management by providing quick access to common `kubectl` commands and resource views directly within your editor. It aims to streamline your Kubernetes workflows, making resource inspection, management, and troubleshooting faster and more intuitive.

## 🙌 Support This Project

If you find this extension helpful, giving the repo a ⭐ would mean a lot!

[![Star on GitHub](https://img.shields.io/github/stars/pratheeshrussell/kube-helper-vscode-ext?style=social)](https://github.com/pratheeshrussell/kube-helper-vscode-ext)

## 📦 How to install
Download the VSIX file from the [Releases Page](https://github.com/pratheeshrussell/kube-helper-vscode-ext/releases). [![Install Extension](https://img.shields.io/badge/Install-Download%20VSIX-blue?logo=visualstudiocode&logoColor=white)](https://github.com/pratheeshrussell/kube-helper-vscode-ext/releases)

Then, run the following command in your terminal:
```sh
code --install-extension kube-helper-<version>.vsix
# Example:
# code --install-extension kube-helper-0.1.0.vsix
```

Alternatively, search for "Kube Helper" in the VSCode Extensions view. (Coming Soon!)

## ✨ Features

Kube Helper offers a comprehensive suite of features to manage your Kubernetes clusters:

*   **List Resources**: Easily view resources across your cluster or within a specific namespace. Supported resources include:
    *   Pods
    *   Services
    *   Deployments
    *   StatefulSets
    *   DaemonSets
    *   ReplicaSets
    *   Ingresses
    *   **ConfigMaps**
    *   **Secrets**
    *   **Custom Resource Definitions (CRDs)**
    *   **Custom Resources (CRs)** for installed CRDs
    *   Namespaces, Nodes, Persistent Volumes, Storage Classes, ClusterRoles, ClusterRoleBindings, Roles, RoleBindings, ServiceAccounts, and IngressClasses.
*   **View Resource Details**:
    *   Inspect the full **YAML definition** of any supported resource.
    *   View detailed `kubectl describe` like output.
    *   Access **related Kubernetes events** for easier debugging.
*   **Edit Resources**: Modify live resource configurations using an integrated YAML editor.
*   **Pod Logs**:
    *   Stream logs directly from pods into VSCode.
    *   **Support for selecting specific containers** within a pod.
    *   **View previous logs** for terminated containers.
*   **Exec into Containers**: Open an interactive terminal session within your pod's containers.
*   **Port Forward Resources**: Easily forward local ports to pods and services.
*   **Contextual Actions**:
    *   Quick action menus (view details, logs, exec, edit, delete) available directly in resource lists for faster workflows.
*   **Resource Tree View**:
    *   Visualize your Kubernetes resources in a hierarchical tree/graph structure, offering an intuitive understanding of relationships (e.g., Deployment → ReplicaSet → Pods).
    *   View resource status and basic details directly within the tree.
    *   Currently accessible via the 'Resource Tree' tab in the cluster-wide view for a selected namespace.
    *   *(New Screenshot: A visual representation of the Resource Tree View)*
        `docs/feat_img_tree_view.png` (placeholder for new screenshot)
*   **Improved Error Messaging**: Clearer feedback for command failures and issues within the UI.

### Existing Screenshots (may need update)
![List Namespaces / Cluster Overview](docs/feat_img_1.png)
![Namespace Details / Resource Lists](docs/feat_img_3.png)
![View Pod Details (Logs, YAML, etc.)](docs/feat_img_2.png)


## 🛠 Requirements

*   **`kubectl` CLI**: This extension relies on the `kubectl` command-line tool. Ensure it's installed and configured to connect to your Kubernetes cluster(s), and that it's accessible in your system's PATH.

## ⚙️ Extension Settings

*   Activate the extension by clicking on its icon in the VSCode sidebar.
*   The extension uses your active `kubectl` context by default. You can switch contexts using `kubectl config use-context <context-name>` or via other Kubernetes context management tools.

## 🐞 Known Issues

*   While significantly expanded, the extension may not yet support every niche aspect of all Kubernetes resource types.
*   The Resource Tree View is in its initial version; performance and advanced relationship linking (e.g., ConfigMaps/Secrets to workloads) will be improved in future updates.
*   Feel free to open a [feature request](https://github.com/pratheeshrussell/kube-helper-vscode-ext/issues/new?template=2-feature-req.yml) or [bug report](https://github.com/pratheeshrussell/kube-helper-vscode-ext/issues/new?template=1-bug-report.yml).

## 🙏 Credits
*   Icons by [icons8.com](https://icons8.com)
*   Uses Vue Flow for the Resource Tree View - a highly customizable Vue component for building node-based editors and diagrams.
*   Uses Dagre for automated graph layout in the Resource Tree View.