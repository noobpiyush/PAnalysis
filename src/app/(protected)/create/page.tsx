"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useRefetch from "@/hooks/use-refetch";
import { api } from "@/trpc/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormInput = {
  repoUrl: string;
  projectName: string;
  gitubToken?: string;
};

const CreatePage = () => {
  const { register, handleSubmit, reset } = useForm<FormInput>();
  const createProject = api.project.createProject.useMutation();
  const refetch =  useRefetch();

  function onSubmit(data: FormInput) {
    createProject.mutate({
      githubUrl:data.repoUrl,
      name:data.projectName,
      githubToken:data.gitubToken
    }, {
      onSuccess: () => {
        toast.success('Project created sucessfully')
        refetch();
        reset();
      },
      onError: () => {
        toast.error('Failed to create Project')
      }
    })
    return true;
  }

  return (
    <div className="flex h-full items-center justify-center gap-12">
      <img src="/undraw_github.svg" alt="" className="h-56 w-auto" />
      <div>
        <div>
          <h1 className="text-2xl font-semibold">
            Link your GitHub Repository
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter the URL of your GitHub repository to link it to PAnalysis.
          </p>
        </div>
        <div className="h-4"></div>
        <div>
          <form onSubmit={handleSubmit(onSubmit)} >
            <Input
              {...register('projectName', {required:true})}
              placeholder="Project Name"
              required
            />
            <div className="h-2"></div>
            <Input
              {...register('repoUrl', {required:true})}
              placeholder="Github URL"
              required
              type="url"
            />
            <div className="h-2"></div>
            <Input
              {...register('gitubToken')}
              placeholder="Github Token (Optional)"
            />
            <div className="h-4"></div>
            <Button disabled={createProject.isPending} type="submit">
              Create Project
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePage;
