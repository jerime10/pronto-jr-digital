import React, { useState, useEffect, useMemo } from 'react';
import { ImageUploader } from './ImageUploader';
import { ImageData } from '@/types/imageTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Sparkles, Trash2, ShieldCheck, UserCheck, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { fetchSiteSettings } from '@/services/siteSettingsService';
import { fetchDocumentAssets } from '@/services/documentAssetsService';
import { SiteSettings } from '@/types/siteSettingsTypes';

interface ImageUploadTabProps {
  images?: ImageData[];
  onImagesChange?: (images: ImageData[]) => void;
  dynamicFields?: Record<string, string>;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
}

export const ImageUploadTab: React.FC<ImageUploadTabProps> = ({
  images = [],
  onImagesChange = () => {},
  dynamicFields = {},
  onDynamicFieldsChange
}) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [rtFallbackBase64, setRtFallbackBase64] = useState<string | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Carregar configurações do site e fallback de imagem
  useEffect(() => {
    let isMounted = true;

    async function loadAssetsAndSettings() {
      setIsLoadingSettings(true);
      try {
        const [settings, assets] = await Promise.allSettled([
          fetchSiteSettings(),
          fetchDocumentAssets()
        ]);

        let resolvedSettings: SiteSettings | null = null;
        if (settings.status === 'fulfilled' && settings.value) {
          resolvedSettings = settings.value;
        }

        // Se faltar assinatura no siteSettings, tentar complementar com documentAssets
        if (assets.status === 'fulfilled' && assets.value) {
          const docAssets = assets.value;
          if (resolvedSettings) {
            resolvedSettings = {
              ...resolvedSettings,
              signatureData: resolvedSettings.signatureData || docAssets.signatureData || null,
              rtSignatureData: resolvedSettings.rtSignatureData || docAssets.rtSignatureData || null,
              signatureProfessionalName: resolvedSettings.signatureProfessionalName || docAssets.signatureProfessionalName || null,
              rtName: resolvedSettings.rtName || docAssets.rtName || null,
            };
          }
        }

        if (isMounted) {
          setSiteSettings(resolvedSettings);
        }

        // Se ainda não tiver assinatura RT, carregar o arquivo estático /signatura_rt.png
        if (!resolvedSettings?.rtSignatureData) {
          try {
            const res = await fetch('/signatura_rt.png');
            if (res.ok) {
              const blob = await res.blob();
              const reader = new FileReader();
              reader.onloadend = () => {
                if (isMounted && typeof reader.result === 'string') {
                  setRtFallbackBase64(reader.result);
                }
              };
              reader.readAsDataURL(blob);
            }
          } catch (e) {
            console.log('Sem fallback estático de RT');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de assinaturas:', err);
      } finally {
        if (isMounted) {
          setIsLoadingSettings(false);
        }
      }
    }

    loadAssetsAndSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const profSignature = siteSettings?.signatureData || null;
  const rtSignature = siteSettings?.rtSignatureData || rtFallbackBase64 || null;
  const profName = siteSettings?.signatureProfessionalName || 'Profissional';
  const rtName = siteSettings?.rtName || 'Responsável Técnico (RT)';

  // Parse existing page signatures from dynamicFields
  const signatures: Record<string, string[]> = useMemo(() => {
    try {
      if (dynamicFields && dynamicFields.page_signatures) {
        const parsed = typeof dynamicFields.page_signatures === 'string'
          ? JSON.parse(dynamicFields.page_signatures)
          : dynamicFields.page_signatures;
        return parsed || {};
      }
    } catch (e) {
      console.error('Erro ao ler assinaturas das páginas:', e);
    }
    return {};
  }, [dynamicFields]);

  const saveSignatures = (newSignatures: Record<string, string[]>) => {
    if (onDynamicFieldsChange) {
      onDynamicFieldsChange({
        ...(dynamicFields || {}),
        page_signatures: JSON.stringify(newSignatures)
      });
    }
  };

  const handleSignatureUpload = async (pageId: string, index: number, file: File) => {
    try {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error('Apenas arquivos PNG, JPG e JPEG são permitidos');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo permitido: 2MB');
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            toast.error('Erro ao processar imagem');
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/png');

          const currentSigs = { ...signatures };
          if (!currentSigs[pageId]) {
            currentSigs[pageId] = ['', ''];
          }
          currentSigs[pageId][index] = dataUrl;
          saveSignatures(currentSigs);
          toast.success('Assinatura inserida com sucesso!');
        };
        img.onerror = () => toast.error('Erro ao processar imagem');
      };
      reader.onerror = () => toast.error('Erro ao ler arquivo de assinatura');
    } catch (e) {
      toast.error('Erro ao processar assinatura');
    }
  };

  const handleSelectPreSavedSignature = (pageId: string, index: number, base64: string, label: string) => {
    if (!base64) {
      toast.error(`A assinatura de ${label} não está cadastrada nas configurações.`);
      return;
    }
    const currentSigs = { ...signatures };
    if (!currentSigs[pageId]) {
      currentSigs[pageId] = ['', ''];
    }
    currentSigs[pageId][index] = base64;
    saveSignatures(currentSigs);
    toast.success(`Assinatura de ${label} aplicada no Slot ${index + 1}!`);
  };

  const handleRemoveSignature = (pageId: string, index: number) => {
    const currentSigs = { ...signatures };
    if (currentSigs[pageId]) {
      currentSigs[pageId][index] = '';
      if (!currentSigs[pageId][0] && !currentSigs[pageId][1]) {
        delete currentSigs[pageId];
      }
      saveSignatures(currentSigs);
      toast.success('Assinatura removida');
    }
  };

  // Determinar a lista de páginas geradas
  const pages = useMemo(() => {
    const list = [
      { id: 'geral', name: 'Página 1 (Identificação / Anamnese)', tag: 'Pág 1' },
      { id: 'evolucao', name: 'Página 2 (Evolução Clínica)', tag: 'Pág 2' },
      { id: 'laudo', name: 'Página 3 (Laudo / Resultado)', tag: 'Pág 3' }
    ];

    const safeImages = Array.isArray(images) ? images : [];
    const imagesCount = safeImages.length;
    const imagesPagesCount = Math.ceil(imagesCount / 6);

    for (let i = 1; i <= imagesPagesCount; i++) {
      list.push({
        id: `imagens_pag_${i}`,
        name: `Página de Imagens ${i}`,
        tag: `Imagens ${i}`
      });
    }

    return list;
  }, [images]);

  // Ações em massa
  const handleApplyToAllPages = (type: 'prof' | 'rt' | 'both', slotIndex: number = 0) => {
    const currentSigs = { ...signatures };

    if (type === 'prof') {
      if (!profSignature) {
        toast.error('Assinatura Profissional não cadastrada nas configurações.');
        return;
      }
      pages.forEach(p => {
        if (!currentSigs[p.id]) currentSigs[p.id] = ['', ''];
        currentSigs[p.id][slotIndex] = profSignature;
      });
      saveSignatures(currentSigs);
      toast.success(`Assinatura Profissional aplicada em todas as ${pages.length} páginas!`);
    } else if (type === 'rt') {
      if (!rtSignature) {
        toast.error('Assinatura RT não cadastrada nas configurações.');
        return;
      }
      pages.forEach(p => {
        if (!currentSigs[p.id]) currentSigs[p.id] = ['', ''];
        currentSigs[p.id][slotIndex] = rtSignature;
      });
      saveSignatures(currentSigs);
      toast.success(`Assinatura RT aplicada em todas as ${pages.length} páginas!`);
    } else if (type === 'both') {
      if (!profSignature && !rtSignature) {
        toast.error('Nenhuma assinatura pré-salva encontrada nas configurações.');
        return;
      }
      pages.forEach(p => {
        currentSigs[p.id] = [profSignature || '', rtSignature || ''];
      });
      saveSignatures(currentSigs);
      toast.success(`Assinaturas Duplas (Profissional + RT) aplicadas em todas as ${pages.length} páginas!`);
    }
  };

  const handleClearAllSignatures = () => {
    saveSignatures({});
    toast.success('Todas as assinaturas do documento foram removidas.');
  };

  const totalAssinaturasConfiguradas = useMemo(() => {
    let count = 0;
    Object.values(signatures).forEach(sigs => {
      if (sigs[0]) count++;
      if (sigs[1]) count++;
    });
    return count;
  }, [signatures]);

  return (
    <div className="space-y-10">
      {/* 1. SEÇÃO DE IMAGENS DO EXAME */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Anexar Imagens e Fotos do Exame
            </h3>
            <p className="text-xs text-slate-500">
              Adicione fotos de ultrassom ou exames clínicos complementares (opcional). Cada página do PDF comporta até 6 fotos.
            </p>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto font-medium text-xs px-2.5 py-1 bg-slate-50">
            {images.length} imagem(ns) adicionada(s)
          </Badge>
        </div>

        <ImageUploader 
          images={images}
          onImagesChange={onImagesChange}
        />
      </div>

      {/* 2. SEÇÃO DE ASSINATURAS DO DOCUMENTO */}
      <div className="space-y-6 pt-4">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Assinaturas do Documento PDF
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Configure as assinaturas digitais que aparecerão no rodapé de cada página do PDF.
                <br className="hidden sm:inline" />
                • Se inserir <strong className="text-white">1 assinatura</strong>: fica centralizada no rodapé.
                <br className="hidden sm:inline" />
                • Se inserir <strong className="text-white">2 assinaturas</strong>: ficam lado a lado (esquerda e direita).
                <br className="hidden sm:inline" />
                • Sem assinatura: o rodapé fica totalmente limpo.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              {profSignature && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                  <UserCheck className="w-3.5 h-3.5" />
                  Assinatura Profissional Ativa
                </div>
              )}
              {rtSignature && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Assinatura RT Ativa
                </div>
              )}
            </div>
          </div>

          {/* Atalhos Rápidos Globais */}
          <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Ações Rápidas:
              </span>

              {profSignature && rtSignature && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleApplyToAllPages('both')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-8 rounded-lg shadow-sm"
                >
                  Aplicar Dupla (Prof + RT) em Todas
                </Button>
              )}

              {profSignature && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleApplyToAllPages('prof', 0)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs h-8 rounded-lg"
                >
                  Profissional em Todas (Esquerda/Centro)
                </Button>
              )}

              {rtSignature && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => handleApplyToAllPages('rt', 1)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs h-8 rounded-lg"
                >
                  RT em Todas (Direita)
                </Button>
              )}
            </div>

            {totalAssinaturasConfiguradas > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClearAllSignatures}
                className="text-red-300 hover:text-red-100 hover:bg-red-950/40 text-xs h-8 rounded-lg gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Todas
              </Button>
            )}
          </div>
        </div>

        {/* Grade de Páginas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {pages.map((page) => {
            const pageSigs = signatures[page.id] || ['', ''];
            const hasSlot1 = !!pageSigs[0];
            const hasSlot2 = !!pageSigs[1];

            return (
              <Card key={page.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
                <CardHeader className="py-3 px-4 bg-slate-50 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {page.tag}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-800">
                        {page.name}
                      </CardTitle>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasSlot1 && hasSlot2 ? (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">2 Assinaturas</Badge>
                    ) : hasSlot1 || hasSlot2 ? (
                      <Badge className="bg-blue-600 text-white text-[10px] font-semibold">1 Centralizada</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 text-[10px]">Sem Assinatura</Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 grid grid-cols-2 gap-4">
                  {/* Slot 1: Esquerda / Centro */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-white rounded-xl p-3 min-h-[175px] relative transition-all group">
                    {hasSlot1 ? (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <div className="h-[85px] w-full flex items-center justify-center overflow-hidden bg-slate-50/50 rounded-lg p-1">
                          <img src={pageSigs[0]} className="max-h-full max-w-full object-contain" alt="Assinatura 1" />
                        </div>
                        <button 
                          onClick={() => handleRemoveSignature(page.id, 0)}
                          className="absolute top-2 right-2 p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors shadow-sm"
                          title="Remover assinatura"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-600 mt-2 text-center">
                          Assinatura 1 (Esquerda/Centro)
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full py-1">
                        <label className="flex flex-col items-center justify-center cursor-pointer p-1 hover:bg-slate-50 rounded-lg transition-colors w-full">
                          <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors mb-1" />
                          <span className="text-[11px] text-slate-700 font-semibold">Carregar Arquivo</span>
                          <input 
                            type="file" 
                            accept="image/png,image/jpeg,image/jpg" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleSignatureUpload(page.id, 0, file);
                            }}
                          />
                        </label>
                        
                        {(profSignature || rtSignature) && (
                          <div className="flex flex-col gap-1 w-full mt-2 pt-2 border-t border-slate-100 px-0.5">
                            {profSignature && (
                              <button 
                                type="button"
                                onClick={() => handleSelectPreSavedSignature(page.id, 0, profSignature, 'Profissional')}
                                className="text-[10px] text-emerald-700 hover:bg-emerald-50 font-bold text-center py-1 px-1 bg-emerald-50/50 border border-emerald-200/60 rounded transition-colors"
                              >
                                Usar Profissional
                              </button>
                            )}
                            {rtSignature && (
                              <button 
                                type="button"
                                onClick={() => handleSelectPreSavedSignature(page.id, 0, rtSignature, 'RT')}
                                className="text-[10px] text-teal-700 hover:bg-teal-50 font-bold text-center py-1 px-1 bg-teal-50/50 border border-teal-200/60 rounded transition-colors"
                              >
                                Usar RT
                              </button>
                            )}
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 text-center mt-1.5 font-medium">
                          (Esquerda / Centro)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Slot 2: Direita */}
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-white rounded-xl p-3 min-h-[175px] relative transition-all group">
                    {hasSlot2 ? (
                      <div className="flex flex-col items-center justify-center w-full h-full">
                        <div className="h-[85px] w-full flex items-center justify-center overflow-hidden bg-slate-50/50 rounded-lg p-1">
                          <img src={pageSigs[1]} className="max-h-full max-w-full object-contain" alt="Assinatura 2" />
                        </div>
                        <button 
                          onClick={() => handleRemoveSignature(page.id, 1)}
                          className="absolute top-2 right-2 p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors shadow-sm"
                          title="Remover assinatura"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[10px] font-bold text-slate-600 mt-2 text-center">
                          Assinatura 2 (Direita)
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full py-1">
                        <label className="flex flex-col items-center justify-center cursor-pointer p-1 hover:bg-slate-50 rounded-lg transition-colors w-full">
                          <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors mb-1" />
                          <span className="text-[11px] text-slate-700 font-semibold">Carregar Arquivo</span>
                          <input 
                            type="file" 
                            accept="image/png,image/jpeg,image/jpg" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleSignatureUpload(page.id, 1, file);
                            }}
                          />
                        </label>
                        
                        {(profSignature || rtSignature) && (
                          <div className="flex flex-col gap-1 w-full mt-2 pt-2 border-t border-slate-100 px-0.5">
                            {profSignature && (
                              <button 
                                type="button"
                                onClick={() => handleSelectPreSavedSignature(page.id, 1, profSignature, 'Profissional')}
                                className="text-[10px] text-emerald-700 hover:bg-emerald-50 font-bold text-center py-1 px-1 bg-emerald-50/50 border border-emerald-200/60 rounded transition-colors"
                              >
                                Usar Profissional
                              </button>
                            )}
                            {rtSignature && (
                              <button 
                                type="button"
                                onClick={() => handleSelectPreSavedSignature(page.id, 1, rtSignature, 'RT')}
                                className="text-[10px] text-teal-700 hover:bg-teal-50 font-bold text-center py-1 px-1 bg-teal-50/50 border border-teal-200/60 rounded transition-colors"
                              >
                                Usar RT
                              </button>
                            )}
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 text-center mt-1.5 font-medium">
                          (Direita)
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

