export class Utils {
    public static getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    public static async executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
        // This is a placeholder implementation.
        // In a real VS Code extension, you'd use child_process.exec or a similar method.
        // You would also need to ensure kubectl is in the PATH or use a configured path.
        console.log(`Executing command: ${command}`);
        // Simulate kubectl config current-context
        if (command === 'kubectl config current-context') {
            // Try to get it from VS Code settings or environment variable as a fallback for simulation
            // const currentContext = vscode.workspace.getConfiguration('kube-helper').get('current-context');
            // if (currentContext) return Promise.resolve({ stdout: currentContext as string, stderr: '' });
            return Promise.resolve({ stdout: 'docker-desktop', stderr: '' }); // Example context
        }
        // Simulate other kubectl get commands returning empty items list for now
        if (command.startsWith('kubectl get')) {
            return Promise.resolve({ stdout: '{"items":[]}', stderr: '' });
        }
        return Promise.reject(new Error(`Command execution not implemented in this mock: ${command}`));
    }

    public static async getCurrentKubeContext(): Promise<string | undefined> {
        try {
            const { stdout, stderr } = await this.executeCommand('kubectl config current-context');
            if (stderr) {
                console.error(`Error getting current kube context: ${stderr}`);
                return undefined;
            }
            return stdout.trim();
        } catch (error) {
            console.error(`Exception getting current kube context: ${error}`);
            return undefined;
        }
    }
}