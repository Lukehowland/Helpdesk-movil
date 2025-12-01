import { View, ScrollView, Text, Alert, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ProgressBar, Card, Avatar, IconButton, TextInput, HelperText, Chip, ActivityIndicator } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { useCompanyStore } from '@/stores/companyStore';
import { useTicketStore } from '@/stores/ticketStore';
import { ControlledInput } from '@/components/ui/ControlledInput';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CompanyExploreItem } from '@/types/company';
import { useDebounceCallback } from '@/hooks/useDebounceCallback';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ListItemSkeleton } from '@/components/Skeleton';

const createTicketSchema = z.object({
    title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
    description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
    categoryId: z.string().min(1, 'Debes seleccionar una categoría'),
    areaId: z.string().optional().nullable(),
    priority: z.enum(['low', 'medium', 'high']),
});

type CreateTicketData = z.infer<typeof createTicketSchema>;

export default function CreateTicketScreen() {
    const router = useRouter();
    const { companies, fetchCompanies, companiesLoading, setFilter, clearFilters } = useCompanyStore();
    const { createTicket, isLoading, categories, fetchCategories, creationStatus, checkCompanyAreasEnabled, fetchAreas } = useTicketStore();

    // Steps: 1=Company, 2=Classification (Area/Category), 3=Priority, 4=Details
    const [step, setStep] = useState(1);
    const [classificationSubStep, setClassificationSubStep] = useState<'area' | 'category'>('category'); // 'area' first if enabled

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [attachments, setAttachments] = useState<ImagePicker.ImagePickerAsset[]>([]);

    // Area logic
    const [areasEnabled, setAreasEnabled] = useState(false);
    const [areas, setAreas] = useState<any[]>([]);
    const [loadingAreas, setLoadingAreas] = useState(false);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionProgress, setSubmissionProgress] = useState(0);
    const [submissionStatusText, setSubmissionStatusText] = useState('');
    const [submissionResult, setSubmissionResult] = useState<'success' | 'error' | null>(null);

    const { control, handleSubmit, formState: { errors, isValid }, setValue, watch, trigger } = useForm<CreateTicketData>({
        resolver: zodResolver(createTicketSchema),
        defaultValues: {
            priority: 'medium',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        setFilter('followedByMe', true);
        fetchCompanies();
        return () => clearFilters();
    }, []);

    useEffect(() => {
        const loadCompanyData = async () => {
            if (selectedCompanyId) {
                setLoadingAreas(true);
                // 1. Check Areas first
                const enabled = await checkCompanyAreasEnabled(selectedCompanyId);
                setAreasEnabled(enabled);

                if (enabled) {
                    const companyAreas = await fetchAreas(selectedCompanyId);
                    setAreas(companyAreas);
                    setClassificationSubStep('area'); // Start with Area if enabled
                } else {
                    setAreas([]);
                    setValue('areaId', null);
                    setClassificationSubStep('category'); // Skip to Category
                }

                // 2. Fetch Categories
                fetchCategories(selectedCompanyId);
                setLoadingAreas(false);
            }
        };
        loadCompanyData();
    }, [selectedCompanyId]);

    const handleSelectCompany = useDebounceCallback((companyId: string) => {
        setSelectedCompanyId(companyId);
        setStep(2);
    }, 200);

    const handleSelectArea = (areaId: string) => {
        setValue('areaId', areaId);
        setClassificationSubStep('category'); // Move to Category sub-step
    };

    const handleSelectCategory = (categoryId: string) => {
        setValue('categoryId', categoryId);
        // Auto advance to Priority step
        setStep(3);
    };

    const handleSelectPriority = (priority: 'low' | 'medium' | 'high') => {
        setValue('priority', priority);
        setStep(4);
    };

    const handleBack = () => {
        if (step === 1) {
            router.back();
        } else if (step === 2) {
            if (classificationSubStep === 'category' && areasEnabled) {
                setClassificationSubStep('area'); // Go back to Area sub-step
            } else {
                setStep(1);
            }
        } else {
            setStep(step - 1);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setAttachments([...attachments, ...result.assets]);
        }
    };

    const removeAttachment = (index: number) => {
        const newAttachments = [...attachments];
        newAttachments.splice(index, 1);
        setAttachments(newAttachments);
    };

    const onSubmit = async (data: CreateTicketData) => {
        if (!selectedCompanyId) return;

        setIsSubmitting(true);
        setSubmissionResult(null);
        setSubmissionProgress(0);
        setSubmissionStatusText('Iniciando...');

        try {
            // Simulate initial progress
            setSubmissionStatusText('Creando Ticket...');
            setSubmissionProgress(0.1);

            // 1. Create Ticket
            // The store's createTicket handles attachment upload internally
            await createTicket({
                title: data.title,
                description: data.description,
                category_id: data.categoryId,
                area_id: data.areaId || undefined,
                priority: data.priority,
                company_id: selectedCompanyId
            }, attachments);

            // Success is handled by the useEffect watching creationStatus/isLoading
        } catch (error) {
            console.error(error);
            setSubmissionResult('error');
            setTimeout(() => {
                setIsSubmitting(false);
                setSubmissionResult(null);
            }, 2000);
            return; // Exit
        }
    };

    // Watch creationStatus to update progress
    useEffect(() => {
        if (!isSubmitting) return;

        if (creationStatus === 'Creando ticket...') {
            setSubmissionProgress(0.2);
            setSubmissionStatusText(creationStatus);
        } else if (creationStatus.startsWith('Subiendo')) {
            // Try to parse "Subiendo archivo X de Y"
            const match = creationStatus.match(/(\d+) de (\d+)/);
            if (match) {
                const current = parseInt(match[1]);
                const total = parseInt(match[2]);
                // Map to 30% -> 90%
                const percentage = 0.3 + ((current / total) * 0.6);
                setSubmissionProgress(percentage);
            } else {
                setSubmissionProgress(0.3);
            }
            setSubmissionStatusText(creationStatus);
        } else if (!isLoading && isSubmitting && !submissionResult) {
            // Finished
            setSubmissionProgress(1);
            setSubmissionStatusText('¡Listo!');
            setSubmissionResult('success');

            setTimeout(() => {
                router.replace('/(tabs)/tickets');
            }, 1000);
        }
    }, [creationStatus, isLoading, isSubmitting, submissionResult]);


    // Calculate visual progress for the header
    // Steps: 1, 2 (area/cat), 3, 4
    // Total segments: 4
    // If step 2 and area enabled:
    //   SubStep Area: 1.5 / 4 ?
    //   SubStep Category: 2 / 4
    const getHeaderProgress = () => {
        let current = step;
        if (step === 2 && areasEnabled && classificationSubStep === 'area') {
            current = 1.5;
        }
        return current / 4;
    };

    const renderStep1 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-4">Selecciona una Empresa</Text>
            <ScrollView className="max-h-[75vh]" showsVerticalScrollIndicator={false}>
                {companiesLoading ? (
                    <View>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <ListItemSkeleton key={i} withAvatar lines={2} className="mb-3" />
                        ))}
                    </View>
                ) : companies.length === 0 ? (
                    <View className="items-center py-8">
                        <Text className="text-gray-500 text-center">No sigues a ninguna empresa aún.</Text>
                        <Button mode="text" onPress={() => router.push('/(tabs)/companies')}>Explorar Empresas</Button>
                    </View>
                ) : (
                    companies.map((company: CompanyExploreItem) => (
                        <TouchableOpacity
                            key={company.id}
                            onPress={() => handleSelectCompany(company.id)}
                            className={`p-4 mb-3 rounded-2xl border-2 flex-row items-center bg-white border-gray-100 shadow-sm active:border-blue-500 active:bg-blue-50`}
                        >
                            {company.logoUrl ? (
                                <Avatar.Image size={48} source={{ uri: company.logoUrl }} />
                            ) : (
                                <Avatar.Text size={48} label={company.name.substring(0, 2)} />
                            )}
                            <View className="ml-4 flex-1">
                                <Text className="font-bold text-gray-900 text-lg">{company.name}</Text>
                                <Text className="text-gray-500 text-sm">{typeof company.industry === 'object' ? company.industry?.name : company.industry}</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={24} color="#9ca3af" />
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );

    const renderStep2 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-2">Clasificación</Text>
            <Text className="text-gray-500 mb-6">
                {classificationSubStep === 'area' && areasEnabled
                    ? 'Selecciona el área o departamento correspondiente.'
                    : 'Selecciona la categoría que mejor describa tu problema.'}
            </Text>

            {loadingAreas ? (
                <View>
                    {[1, 2, 3].map((i) => (
                        <ListItemSkeleton key={i} withAvatar={false} lines={2} className="mb-3" />
                    ))}
                </View>
            ) : (
                <>
                    {/* Area Selection */}
                    {areasEnabled && classificationSubStep === 'area' && (
                        <View>
                            {areas.map((area: any) => (
                                <TouchableOpacity
                                    key={area.id}
                                    onPress={() => handleSelectArea(area.id)}
                                    className={`p-4 mb-3 rounded-xl border-2 border-gray-200 bg-white active:border-blue-500 active:bg-blue-50`}
                                >
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Text className="font-bold text-base text-gray-900">{area.name}</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                                    </View>
                                    {area.description && (
                                        <Text className="text-gray-500 text-sm leading-snug">{area.description}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Category Selection */}
                    {(!areasEnabled || classificationSubStep === 'category') && (
                        <View>
                            {categories.map((cat: any) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => handleSelectCategory(cat.id)}
                                    className={`p-4 mb-3 rounded-xl border-2 border-gray-200 bg-white active:border-blue-500 active:bg-blue-50`}
                                >
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Text className="font-bold text-base text-gray-900">{cat.name}</Text>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
                                    </View>
                                    {cat.description && (
                                        <Text className="text-gray-500 text-sm leading-snug">{cat.description}</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </>
            )}
        </View>
    );

    const renderStep3 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-2">Prioridad</Text>
            <Text className="text-gray-500 mb-6">¿Qué tan urgente es tu solicitud?</Text>

            {[
                {
                    value: 'low',
                    label: 'Baja',
                    desc: 'Consultas generales o problemas menores que no afectan el trabajo.',
                    color: 'bg-green-50',
                    border: 'border-green-200',
                    activeBorder: 'border-green-500',
                    icon: 'arrow-down',
                    iconColor: '#166534'
                },
                {
                    value: 'medium',
                    label: 'Media',
                    desc: 'Problemas que afectan parcialmente el trabajo o requieren atención.',
                    color: 'bg-yellow-50',
                    border: 'border-yellow-200',
                    activeBorder: 'border-yellow-500',
                    icon: 'minus',
                    iconColor: '#854d0e'
                },
                {
                    value: 'high',
                    label: 'Alta',
                    desc: 'Problemas críticos que impiden trabajar o requieren solución inmediata.',
                    color: 'bg-red-50',
                    border: 'border-red-200',
                    activeBorder: 'border-red-500',
                    icon: 'arrow-up',
                    iconColor: '#991b1b'
                }
            ].map((p) => (
                <TouchableOpacity
                    key={p.value}
                    onPress={() => handleSelectPriority(p.value as any)}
                    className={`p-4 mb-4 rounded-xl border-2 ${p.color} ${p.border} active:${p.activeBorder}`}
                >
                    <View className="flex-row items-center mb-2">
                        <View className={`p-2 rounded-full bg-white mr-3`}>
                            <MaterialCommunityIcons name={p.icon as any} size={24} color={p.iconColor} />
                        </View>
                        <Text className="font-bold text-lg text-gray-900">{p.label}</Text>
                    </View>
                    <Text className="text-gray-600 text-sm leading-snug ml-1">{p.desc}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderStep4 = () => (
        <View>
            <Text className="text-xl font-bold text-gray-900 mb-2">Detalles Finales</Text>
            <Text className="text-gray-500 mb-6">Describe tu problema y adjunta evidencia.</Text>

            <ControlledInput
                control={control}
                name="title"
                label="Asunto"
                placeholder="Ej: Error al iniciar sesión"
                className="mb-4"
            />

            <ControlledInput
                control={control}
                name="description"
                label="Descripción Detallada"
                placeholder="Explica qué estabas haciendo, qué esperabas que pasara y qué pasó realmente..."
                multiline
                numberOfLines={6}
                className="mb-6"
            />

            <Text className="text-gray-800 font-bold mb-3 text-base">Adjuntos (Opcional)</Text>
            <View className="flex-row flex-wrap gap-3 mb-8">
                {attachments.map((file, index) => (
                    <View key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        <Image source={{ uri: file.uri }} className="w-full h-full" resizeMode="cover" />
                        <TouchableOpacity
                            onPress={() => removeAttachment(index)}
                            className="absolute top-1 right-1 bg-black/60 rounded-full p-1"
                        >
                            <MaterialCommunityIcons name="close" size={14} color="white" />
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity
                    onPress={pickImage}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50 active:bg-gray-100"
                >
                    <MaterialCommunityIcons name="camera-plus" size={28} color="#9ca3af" />
                    <Text className="text-xs text-gray-400 mt-1 font-medium">Añadir</Text>
                </TouchableOpacity>
            </View>

            <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                className="mt-4 rounded-xl"
                contentStyle={{ height: 48 }}
            >
                Crear Ticket
            </Button>
        </View>
    );

    const SubmissionOverlay = () => {
        if (!isSubmitting) return null;

        return (
            <View className="absolute inset-0 bg-white/95 z-50 items-center justify-center px-8">
                {submissionResult === 'success' ? (
                    <View className="items-center">
                        <View className="bg-green-100 p-6 rounded-full mb-6">
                            <MaterialCommunityIcons name="check" size={48} color="#166534" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">¡Ticket Creado!</Text>
                        <Text className="text-gray-500 text-center">Tu solicitud ha sido registrada correctamente.</Text>
                    </View>
                ) : submissionResult === 'error' ? (
                    <View className="items-center">
                        <View className="bg-red-100 p-6 rounded-full mb-6">
                            <MaterialCommunityIcons name="alert" size={48} color="#991b1b" />
                        </View>
                        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">Algo salió mal</Text>
                        <Text className="text-gray-500 text-center">No pudimos crear tu ticket. Por favor intenta de nuevo.</Text>
                    </View>
                ) : (
                    <View className="items-center w-full">
                        <ActivityIndicator size="large" color="#2563eb" className="mb-8" />
                        <Text className="text-xl font-bold text-gray-900 mb-2">
                            {submissionStatusText || 'Procesando...'}
                        </Text>
                        <Text className="text-gray-500 text-center mb-6">
                            {Math.round(submissionProgress * 100)}% completado
                        </Text>
                        <ProgressBar
                            progress={submissionProgress}
                            color="#2563eb"
                            className="h-2 rounded-full w-full bg-gray-100"
                        />
                    </View>
                )}
            </View>
        );
    };

    return (
        <ScreenContainer backgroundColor="white">
            <SubmissionOverlay />

            <View className="p-4 border-b border-gray-100 flex-row items-center justify-between bg-white">
                <TouchableOpacity onPress={handleBack} className="p-2 -ml-2 rounded-full active:bg-gray-100">
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View className="flex-row gap-1">
                    {[1, 2, 3, 4].map(i => (
                        <View
                            key={i}
                            className={`h-1.5 w-6 rounded-full ${step >= i ? 'bg-blue-600' : 'bg-gray-200'}`}
                        />
                    ))}
                </View>
                <View className="w-8" />
            </View>

            <View className="px-6 pt-4 pb-2">
                <ProgressBar progress={getHeaderProgress()} color="#2563eb" className="h-1 rounded-full bg-gray-100" />
            </View>

            <ScrollView className="flex-1 px-6 py-6" showsVerticalScrollIndicator={false}>
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                <View className="h-20" />
            </ScrollView>
        </ScreenContainer>
    );
}
